// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//import "./interfaces/IHyperswapRouter.sol";
import "../interfaces/IUniswapV2Pair.sol";
import "../interfaces/IUniswapV2Router.sol";
import "../interfaces/IVault.sol";
import "../lib/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Zapper is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /* ========== STATE VARIABLES ========== */

    // @NATIVE - native token that is not a part of our zap-in LP
    address private NATIVE;

    struct LiquidityPair {
        address _token0;
        address _token1;
        uint256 _amountToken0;
        uint256 _amountToken1;
        uint256 _liqTokenAmt;
    }

    struct FunctionArgs {
        address _LP;
        address _in;
        address _out;
        address _recipient;
        address _routerAddr;
        address _token;
        uint256 _amount;
        uint256 _slippage;
        uint256 _otherAmt;
        uint256 _swapAmt;
    }

    mapping(address => mapping(address => address)) private intermediateTokenForRouter;

    mapping (address => bool) public NativeRouter;

    modifier whitelist(address route) {
        require(NativeRouter[route], "route not allowed");
        _;
    }

    constructor(address _NATIVE) Ownable() {
        NATIVE = _NATIVE;
    }

    /* ========== External Functions ========== */

    receive() external payable {}

    function NativeToken() public view returns (address) {
        return NATIVE;
    }

    // @_in - Token we want to throw in
    // @amount - amount of our _in
    // @out - address of LP we are going to get

    function zapInToken(address _in, uint256 amount, address out, address routerAddr, address recipient, uint256 minAmountLp) external whitelist(routerAddr) {
        // From an ERC20 to an LP token, through specified router, going through base asset if necessary
        IERC20(_in).safeTransferFrom(msg.sender, address(this), amount);
        // we'll need this approval to add liquidity
        _approveTokenIfNeeded(_in, routerAddr);
       uint256 lpAmount =_swapTokenToLP(_in, amount, out, recipient, routerAddr);
       require (lpAmount >= minAmountLp, string(abi.encodePacked(lpAmount, " < ", minAmountLp)));
    }
    // @_in - Token we want to throw in
    // @amount - amount of our _in
    // @out - address of LP we are going to get

    function estimateZapInToken(address _in, address out, address router, uint256 amount) public view whitelist(router) returns (uint256, uint256) {
        // get pairs for desired lp
        // check if we already have one of the assets
        if (_in == IUniswapV2Pair(out).token0() || _in == IUniswapV2Pair(out).token1()) {
            // if so, we're going to sell half of in for the other token we need
            // figure out which token we need, and approve
            address other = _in == IUniswapV2Pair(out).token0() ? IUniswapV2Pair(out).token1() : IUniswapV2Pair(out).token0();
            // calculate amount of in to sell
            uint256 sellAmount = amount.div(2);
            // calculate amount of other token for potential lp
            uint256 otherAmount = _estimateSwap(_in, sellAmount, other, router);
            if (_in == IUniswapV2Pair(out).token0()) {
                return (sellAmount, otherAmount);
            } else {
                return (otherAmount, sellAmount);
            }
        } else {
            // go through native token, that's not in our LP, for highest liquidity
            uint256 nativeAmount = _in == NATIVE ? amount : _estimateSwap(_in, amount, NATIVE, router);
            return estimateZapIn(out, router, nativeAmount);
        }
    }

    function estimateZapIn(address LP, address router, uint256 amount) public view whitelist(router) returns (uint256, uint256) {
        uint256 zapAmount = amount.div(2);

        IUniswapV2Pair pair = IUniswapV2Pair(LP);
        address token0 = pair.token0();
        address token1 = pair.token1();

        if (token0 == NATIVE || token1 == NATIVE) {
            address token = token0 == NATIVE ? token1 : token0;
            uint256 tokenAmount = _estimateSwap(NATIVE, zapAmount, token, router);
            if (token0 == NATIVE) {
                return (zapAmount, tokenAmount);
            } else {
                return (tokenAmount, zapAmount);
            }
        } else {
            uint256 amountToken0 = _estimateSwap(NATIVE, zapAmount, token0, router);
            uint256 amountToken1 = _estimateSwap(NATIVE, zapAmount, token1, router);

            return (amountToken0, amountToken1);
        }
    }

    // from Native to an LP token through the specified router
    // @ out - LP we want to get out of this
    function nativeZapIn(
        uint256 amount, 
        address out, 
        address routerAddr, 
        address recipient, 
        uint256 minAmountLp) external payable whitelist (routerAddr) {
        
        IERC20(NATIVE).safeTransferFrom(msg.sender, address(this), amount);
        _approveTokenIfNeeded(NATIVE, routerAddr);
        
        uint256 amountLp =_swapNativeToLP(out, amount, recipient, routerAddr);
       
        require(amountLp >= minAmountLp, string(abi.encodePacked(Strings.toString(amountLp), " < ", Strings.toString(minAmountLp))));
    }

   
   

    /* ========== Private Functions ========== */

    function _approveTokenIfNeeded(address token, address router) private {
        if (IERC20(token).allowance(address(this), router) == 0) {
            IERC20(token).safeApprove(router, type(uint256).max);
        }
    }
   
    // @in - token we want to throw in
    // @amount - amount of our token
    // @out - LP we want to get
    function _swapTokenToLP(address _in, uint256 amount, address out, address recipient, address routerAddr) private returns (uint256) {

        FunctionArgs memory args;
        args._in = _in;
        args._amount = amount;
        args._out = out;
        args._recipient = recipient;
        args._routerAddr = routerAddr;
        LiquidityPair memory pair;

        if (args._in == IUniswapV2Pair(args._out).token0() || args._in == IUniswapV2Pair(args._out).token1()) {

            args._token = args._in == IUniswapV2Pair(args._out).token0() ? IUniswapV2Pair(args._out).token1() : IUniswapV2Pair(args._out).token0();
            // calculate args._amount of _from to sell
            args._swapAmt = args._amount.div(2);
            args._otherAmt = _swap(args._in, args._swapAmt, args._token, address(this), args._routerAddr);
            _approveTokenIfNeeded(args._token, args._routerAddr);
            // execute swap

            (pair._amountToken0 , pair._amountToken1 , pair._liqTokenAmt) = IUniswapV2Router(args._routerAddr).addLiquidity(args._in, args._token, args._amount.sub(args._swapAmt),args._otherAmt, 0 , 0, args._recipient, block.timestamp);
            _dustDistribution(args._amount.sub(args._swapAmt), args._otherAmt, pair._amountToken0, pair._amountToken1, args._in, args._token, args._recipient);
            return pair._liqTokenAmt;
        } else {
            // go through native token for highest liquidity
            uint256 nativeAmount = _swapTokenForNative(args._in, args._amount, address(this), args._routerAddr);
            return _swapNativeToLP(args._out, nativeAmount, args._recipient, args._routerAddr);
        }
    }

    // @amount - amount of our native token
    // @out - LP we want to get
    function _swapNativeToLP(address out, uint256 amount, address recipient, address routerAddress) private returns (uint256) {

        IUniswapV2Pair pair = IUniswapV2Pair(out);
        address token0 = pair.token0();
        address token1 = pair.token1();
        uint256 liquidity;

        liquidity = _swapNativeToEqualTokensAndProvide(token0, token1, amount, routerAddress, recipient);
        return liquidity;
    }

    function _dustDistribution(uint256 token0, uint256 token1, uint256 amountToken0, uint256 amountToken1, address native, address token, address recipient) private {
        uint256 nativeDust = token0.sub(amountToken0);
        uint256 tokenDust = token1.sub(amountToken1);
        if (nativeDust > 0) {
            IERC20(native).safeTransfer(recipient, nativeDust);
        }
        if (tokenDust > 0) {
            IERC20(token).safeTransfer(recipient, tokenDust);
        }

    }
    // @token0 - swap Native to this , and provide this to create LP
    // @token1 - swap Native to this , and provide this to create LP
    // @amount - amount of native token
    function _swapNativeToEqualTokensAndProvide(address token0, address token1, uint256 amount, address routerAddress, address recipient) private returns (uint256) {
        FunctionArgs memory args;
        args._amount = amount;
        args._recipient = recipient;
        args._routerAddr = routerAddress;
        args._swapAmt = args._amount.div(2);

        LiquidityPair memory pair;
        pair._token0 = token0;
        pair._token1 = token1;

        IUniswapV2Router router = IUniswapV2Router(args._routerAddr);

        if (pair._token0 == NATIVE) {
            args._otherAmt= _swapNativeForToken(pair._token1, args._swapAmt, address(this), args._routerAddr);
            _approveTokenIfNeeded(pair._token0, args._routerAddr);
            _approveTokenIfNeeded(pair._token1, args._routerAddr);

            (pair._amountToken0, pair._amountToken1, pair._liqTokenAmt) = router.addLiquidity(pair._token0, pair._token1, args._swapAmt, args._otherAmt, 0, 0, args._recipient, block.timestamp);
            _dustDistribution(args._swapAmt, args._otherAmt, pair._amountToken0, pair._amountToken1, pair._token0, pair._token1, args._recipient);
            return pair._liqTokenAmt;
        } else {
            args._otherAmt = _swapNativeForToken(pair._token0,  args._swapAmt, address(this), args._routerAddr);
            _approveTokenIfNeeded( pair._token0, args._routerAddr);
            _approveTokenIfNeeded( pair._token1, args._routerAddr);
            (pair._amountToken0, pair._amountToken1, pair._liqTokenAmt) = router.addLiquidity(pair._token0, pair._token1, args._otherAmt, args._amount.sub( args._swapAmt), 0, 0, args._recipient, block.timestamp);
            _dustDistribution(args._otherAmt, args._amount.sub( args._swapAmt), pair._amountToken0, pair._amountToken1,  pair._token1, pair._token0, args._recipient);
            return pair._liqTokenAmt;
        }
    }
    // @token - swap Native to this token
    // @amount - amount of native token
    function _swapNativeForToken(address token, uint256 amount, address recipient, address routerAddr) private returns (uint256) {
        address[] memory path;
        IUniswapV2Router router = IUniswapV2Router(routerAddr);

        if (intermediateTokenForRouter[token][routerAddr] != address(0)) {
            path = new address[](3);
            path[0] = NATIVE;
            path[1] = intermediateTokenForRouter[token][routerAddr];
            path[2] = token;
        } else {
            path = new address[](2);
            path[0] = NATIVE;
            path[1] = token;
        }
        uint256[] memory amounts = router.swapExactTokensForTokens(amount, 0, path, recipient, block.timestamp);
        return amounts[amounts.length - 1];
    }
    // @token - swap this token to Native
    // @amount - amount of native token
    function _swapTokenForNative(address token, uint256 amount, address recipient, address routerAddr) private returns (uint256) {
        address[] memory path;
        IUniswapV2Router router = IUniswapV2Router(routerAddr);

        if (intermediateTokenForRouter[token][routerAddr] != address(0)) {
            path = new address[](3);
            path[0] = token;
            path[1] = intermediateTokenForRouter[token][routerAddr];
            path[2] = NATIVE;
        } else {
            path = new address[](2);
            path[0] = token;
            path[1] = NATIVE;
        }
      
        uint256[] memory amounts = router.swapExactTokensForTokens(amount, 0, path, recipient, block.timestamp);
        return amounts[amounts.length - 1];
    }
    // @_in - token we want to throw in
    // @amount - amount of our _in
    // @out - token we want to get out
    function _swap(address _in, uint256 amount, address out, address recipient, address routerAddr) private returns (uint256) {
        IUniswapV2Router router = IUniswapV2Router(routerAddr);

        address fromBridge = intermediateTokenForRouter[_in][routerAddr];
        address toBridge = intermediateTokenForRouter[out][routerAddr];

        address[] memory path;

        if (fromBridge != address(0) && toBridge != address(0)) {
            if (fromBridge != toBridge) {
                path = new address[](5);
                path[0] = _in;
                path[1] = fromBridge;
                path[2] = NATIVE;
                path[3] = toBridge;
                path[4] = out;
            } else {
                path = new address[](3);
                path[0] = _in;
                path[1] = fromBridge;
                path[2] = out;
            }
        } else if (fromBridge != address(0)) {
            if (out == NATIVE) {
                path = new address[](3);
                path[0] = _in;
                path[1] = fromBridge;
                path[2] = NATIVE;
            } else {
                path = new address[](4);
                path[0] = _in;
                path[1] = fromBridge;
                path[2] = NATIVE;
                path[3] = out;
            }
        } else if (toBridge != address(0)) {
            path = new address[](4);
            path[0] = _in;
            path[1] = NATIVE;
            path[2] = toBridge;
            path[3] = out;
        } else if (_in == NATIVE || out == NATIVE) {
            path = new address[](2);
            path[0] = _in;
            path[1] = out;
        } else {
            // Go through Native
            path = new address[](3);
            path[0] = _in;
            path[1] = NATIVE;
            path[2] = out;
        }

        uint256[] memory amounts = router.swapExactTokensForTokens(amount, 0, path, recipient, block.timestamp);
        return amounts[amounts.length - 1];
    }
    // @_in - token we want to throw in
    // @amount - amount of our _in
    // @out - token we want to get out
    function _estimateSwap(address _in, uint256 amount, address out, address routerAddr) private view returns (uint256) {
        IUniswapV2Router router = IUniswapV2Router(routerAddr);

        address fromBridge = intermediateTokenForRouter[_in][routerAddr];
        address toBridge = intermediateTokenForRouter[out][routerAddr];

        address[] memory path;

        if (fromBridge != address(0) && toBridge != address(0)) {
            if (fromBridge != toBridge) {
                path = new address[](5);
                path[0] = _in;
                path[1] = fromBridge;
                path[2] = NATIVE;
                path[3] = toBridge;
                path[4] = out;
            } else {
                path = new address[](3);
                path[0] = _in;
                path[1] = fromBridge;
                path[2] = out;
            }
        } else if (fromBridge != address(0)) {
            if (out == NATIVE) {
                path = new address[](3);
                path[0] = _in;
                path[1] = fromBridge;
                path[2] = NATIVE;
            } else {
                path = new address[](4);
                path[0] = _in;
                path[1] = fromBridge;
                path[2] = NATIVE;
                path[3] = out;
            }
        } else if (toBridge != address(0)) {
            path = new address[](4);
            path[0] = _in;
            path[1] = NATIVE;
            path[2] = toBridge;
            path[3] = out;
        } else if (_in == NATIVE || out == NATIVE) {
            path = new address[](2);
            path[0] = _in;
            path[1] = out;
        } else {
            // Go through Native
            path = new address[](3);
            path[0] = _in;
            path[1] = NATIVE;
            path[2] = out;
        }

        uint256[] memory amounts = router.getAmountsOut(amount, path);
        return amounts[amounts.length - 1];
    }
   


    /* ========== RESTRICTED FUNCTIONS ========== */

    function setNativeToken(address _NATIVE) external onlyOwner {
        NATIVE = _NATIVE;
    }

    function setIntermediateTokenForRouter(address token, address router, address intermediateToken) external onlyOwner {
        intermediateTokenForRouter[token][router] = intermediateToken;
    }


    function setNativeRouter(address router) external onlyOwner {
        NativeRouter[router] = true;
    }

    function removeNativeRouter(address router) external onlyOwner {
        NativeRouter[router] = false;
    }
}
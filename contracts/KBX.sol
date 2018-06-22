pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "openzeppelin-solidity/contracts/ownership/Whitelist.sol";


/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `StandardToken` functions.
 */
contract SimpleToken is StandardToken, BurnableToken, Whitelist {

  string public constant name = "KuBitcoin"; // solium-disable-line uppercase
  string public constant symbol = "KBX"; // solium-disable-line uppercase
  uint8 public constant decimals = 18; // solium-disable-line uppercase
  uint256 public constant INITIAL_SUPPLY = 500000000 * (10 ** uint256(decimals));

  mapping(address => bool) public blacklist;
  event BlacklistedAddressAdded(address _address);
  event BlacklistedAddressRemoved(address _address);

  modifier canTransfer(address from, address to) {
    if(!blacklist[from] || (blacklist[from] && whitelist[to])) {
      _;
    } else {
      revert();
    }

  }

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }


  function transfer(address _to, uint _value) canTransfer(msg.sender, _to) public  returns (bool success) {
   return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint _value) canTransfer(_from, _to) public  returns (bool success) {
    return super.transferFrom(_from, _to, _value);
  }

  function burn(uint256 value) public onlyWhitelisted {
    super.burn(value);
  }

  function addAddressToBlacklist(address addr) onlyOwner public returns(bool success) {
    if (!blacklist[addr]) {
      blacklist[addr] = true;
      emit BlacklistedAddressAdded(addr);
      success = true;
    }
  }

  function removeAddressFromBlacklist(address addr) onlyOwner public returns(bool success) {
    if (blacklist[addr]) {
      blacklist[addr] = false;
      emit BlacklistedAddressRemoved(addr);
      success = true;
    }
  }
}

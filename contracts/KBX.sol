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
  address public releaseAgent;

  /** A crowdsale contract can release us to the wild if ICO success. If false we are are in transfer lock up period.*/
  bool public released = false;

  /** Map of agents that are allowed to transfer tokens regardless of the lock down period. These are crowdsale contracts and possible the team multisig itself. */
  mapping (address => bool) public transferAgents;

  modifier canTransfer(address _sender) {
    if(!released) {
        if(!transferAgents[_sender]) {
            revert();
        }
    }

    _;
  }

  modifier inReleaseState(bool releaseState) {
    if(releaseState != released) {
        revert();
    }
    _;
  }

  modifier onlyReleaseAgent() {
    if(msg.sender != releaseAgent) {
        revert();
    }
    _;
  }
  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }


  function setReleaseAgent(address addr) onlyOwner inReleaseState(false) public {

    // We don't do interface check here as we might want to a normal wallet address to act as a release agent
    releaseAgent = addr;
  }

  function setTransferAgent(address addr, bool state) onlyOwner inReleaseState(false) public {
    transferAgents[addr] = state;
  }

  function releaseTokenTransfer() public onlyReleaseAgent {
    released = true;
  }


  function transfer(address _to, uint _value) public canTransfer(msg.sender) returns (bool success) {
   return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint _value) public canTransfer(_from) returns (bool success) {
    return super.transferFrom(_from, _to, _value);
  }

  function burn(uint256 value) public onlyWhitelisted {
    super.burn(value);
  }
}

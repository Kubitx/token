let Token = artifacts.require("./SimpleToken.sol")
import ether  from './helpers/ether';
const EVMRevert = require('./helpers/EVMRevert.js')
import BigNumber  from 'bignumber.js'


require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

contract('Token', async function(accounts) {

  describe('Token Contruction', async () => {
    it('check totalsupply, name, decimals, inital balance and symbol parameters', async () => {
      let token = await Token.new({ from: accounts[0] });
      let name = await token.name();
      assert(name === 'KubitCoin');
      let totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(ether(500000000));
      let balance = await token.balanceOf(accounts[0]);
      balance.should.be.bignumber.equal(ether(500000000));
      let sym = await token.symbol();
      assert(sym === 'KBX');
      let decimals = await token.decimals();
      assert(decimals.toString() == '18');
    });

  });

  describe('Whitelisting', async () => {
    let token;
    beforeEach(async () => {
      token = await Token.new({ from: accounts[0] });
    })
    it('the owner should be whitelisted', async () => {

      let owner = await token.owner();
      assert(owner === accounts[0]);
      let isWhitelisted = await token.whitelist(owner);
      assert(isWhitelisted);
      let numberOfWhitelists = await token.numberOfWhitelists();
      assert(numberOfWhitelists.toString() === '1');
    });

    it('only whitelisted addresses can add to other whitelist', async () => {
      await token.addAddressToWhitelist(accounts[1], { from : accounts[0] });
      let isWhitelisted = await token.whitelist(accounts[1]);
      assert(isWhitelisted);
      let numberOfWhitelists = await token.numberOfWhitelists();
      assert(numberOfWhitelists.toString() === '2');
      await token.addAddressToWhitelist(accounts[2], { from : accounts[2] })
      .should.be.rejectedWith(EVMRevert);
      await token.addAddressToWhitelist(accounts[2], { from : accounts[1] })
      isWhitelisted = await token.whitelist(accounts[2]);
      assert(isWhitelisted);
    });

    it('only whitelisted addresses can remove other whitelisted addresses', async () => {
      await token.addAddressToWhitelist(accounts[1], { from : accounts[0] });
      await token.removeAddressFromWhitelist(accounts[0], { from: accounts[3] })
      .should.be.rejectedWith(EVMRevert);
      await token.removeAddressFromWhitelist(accounts[0], { from: accounts[1] });
      let isWhitelisted = await token.whitelist(accounts[0]);
      assert(isWhitelisted === false);
    });

    it('there has to atleast one whitelisted address all the time', async () => {
      await token.addAddressToWhitelist(accounts[1], { from : accounts[0] });
      await token.removeAddressFromWhitelist(accounts[0], { from: accounts[1] });
      await token.removeAddressFromWhitelist(accounts[1], { from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
      let numberOfWhitelists = await token.numberOfWhitelists();
      assert(numberOfWhitelists.toString() === '1');
    });
  })

  describe('Blacklisting', async () => {
    let token;
    beforeEach(async () => {
      token = await Token.new({ from: accounts[0] });
    });

    it('only whitelist addresses can blacklist another address', async () => {
      await token.addAddressToBlacklist(accounts[1]);
      let isBlacklisted = await token.blacklist(accounts[1]);
      assert(isBlacklisted);
      await token.addAddressToBlacklist(accounts[1], { from : accounts[2]})
      .should.be.rejectedWith(EVMRevert);
    })

    it('only whitelist addresses can remove a blacklist address', async () => {
      await token.addAddressToBlacklist(accounts[1]);
      let isBlacklisted = await token.blacklist(accounts[1]);
      assert(isBlacklisted);
      await token.removeAddressFromBlacklist(accounts[1], { from : accounts[0]})
      isBlacklisted = await token.blacklist(accounts[1]);
      assert(isBlacklisted === false);
    })
  });


  describe('Burn', async () => {
    let token;
    beforeEach(async () => {
      token = await Token.new({ from: accounts[0] });

    });

    it('burn should reduce total supply', async () => {
      await token.burn(ether(10));
      let expectedTotalSupply = ether(500000000 - 10);
      let totalSupply = await token.totalSupply();
      totalSupply.should.be.bignumber.equal(expectedTotalSupply);
    })

    it('burn should not be called by non-whitelist address', async () => {
      await token.transfer(accounts[1], ether(10));
      await token.burn(ether(10), { from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
    })
  });

  describe('Transfer function', async () => {
    let token;
    beforeEach(async () => {
      token = await Token.new({ from: accounts[0] });
    })
    it('Non blacklisted addresses can transfer to any address', async () => {
      await token.transfer(accounts[1], ether(10));
      let balance = await token.balanceOf(accounts[1]);
      balance.should.be.bignumber.equal(ether(10));
    });
    it('Blacklisted address cannot transfer to a non  whitelisted address', async () => {
      await token.addAddressToBlacklist(accounts[0]);
      await token.transfer(accounts[1], ether(10)).should.be.rejectedWith(EVMRevert);
      await token.addAddressToWhitelist(accounts[1]);
      await token.transfer(accounts[1], ether(10));
      let balance = await token.balanceOf(accounts[1]);
      balance.should.be.bignumber.equal(ether(10));
    })
  });

  describe('Tranfer from function', async () => {
    let token;
    beforeEach(async () => {
      token = await Token.new({ from: accounts[0] });
      await token.approve(accounts[1], ether(10));
    })

    it('Non blacklisted addresses can transfer to any address', async () => {
      await token.transferFrom(accounts[0], accounts[2], ether(1), { from: accounts[1] });
      let balance = await token.balanceOf(accounts[2]);
      balance.should.be.bignumber.equal(ether(1));
    });

    it('Blacklisted address cannot transferfrom to a non  whitelisted address', async () => {
      await token.addAddressToBlacklist(accounts[0]);
      await token.transferFrom(accounts[0], accounts[2], ether(1), { from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
      await token.addAddressToWhitelist(accounts[2]);
      await token.transferFrom(accounts[0], accounts[2], ether(1), { from: accounts[1] })
      let balance = await token.balanceOf(accounts[2]);
      balance.should.be.bignumber.equal(ether(1));
    });
  });

  describe('Pausable', async () => {
    let token;
    beforeEach(async () => {
      token = await Token.new({ from: accounts[0] });
      await token.pause()
    })
    it('should not allow transfer when paused', async () => {
      await token.transfer(accounts[1], 1).should.be.rejectedWith(EVMRevert);
    });

    it('should not allow approve when paused', async () => {
      await token.approve(accounts[1], 1).should.be.rejectedWith(EVMRevert);
    })

    it('should not allow burn when paused', async() => {
      await token.burn(ether(1)).should.be.rejectedWith(EVMRevert);
    });

    it('should not allow transferFrom when paused', async () => {
      await token.unpause();
      await token.approve(accounts[1], ether(10));
      await token.pause();
      await token.transferFrom(accounts[0], accounts[2], ether(10), { from: accounts[1] })
      .should.be.rejectedWith(EVMRevert);
    })

    it('should not allow increaseApproval when paused', async () => {
      await token.unpause();
      await token.approve(accounts[1], ether(10));
      await token.pause();
      await token.increaseApproval(accounts[1], ether(10))
      .should.be.rejectedWith(EVMRevert);
    })

    it('should not allow decreaseApproval when paused', async () => {
      await token.unpause();
      await token.approve(accounts[1], ether(10));
      await token.pause();
      await token.decreaseApproval(accounts[1], ether(1))
      .should.be.rejectedWith(EVMRevert);
    });

    it('should not allow blacklisting when paused', async () => {
      await token.addAddressToBlacklist(accounts[1])
      .should.be.rejectedWith(EVMRevert);
    });

    it('cannot remove blacklist when paused', async () => {
      await token.unpause();
      await token.addAddressToBlacklist(accounts[1]);
      await token.pause();
      await token.removeAddressFromBlacklist(accounts[1])
      .should.be.rejectedWith(EVMRevert);
    })

    it('should not allow whitelisting when paused', async () => {
      await token.addAddressToWhitelist(accounts[1]).
      should.be.rejectedWith(EVMRevert);
    });

    it('cannot remove whitelist when paused', async () => {
      await token.unpause();
      await token.addAddressToWhitelist(accounts[1]);
      await token.pause();
      await token.removeAddressFromWhitelist(accounts[1])
      .should.be.rejectedWith(EVMRevert);
    })
  });

});

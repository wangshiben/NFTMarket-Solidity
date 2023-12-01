const { expect } = require("chai");
const { ethers } = require("hardhat");
const { eth } = require("ethers");

describe("Market", function () {
  let usdt, market, myNft, account1, account2;
  let baseURI = "http://127.0.0.1:8545/";

  beforeEach(async () => {
    [account1, account2] = await ethers.getSigners();
    // const MAX_ALLOWANCE = BigNumber.from(2).pow(256).sub(1);
    const USDT = await ethers.getContractFactory("cUSDT");
    usdt = await USDT.deploy();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    myNft = await MyNFT.deploy(account1.address);
    const Market = await ethers.getContractFactory("Market");
    market = await Market.deploy(usdt.target, myNft.target);
    // console.log(account1)

    await myNft.safeMint(account1.address, baseURI + "0");
    await myNft.safeMint(account1.address, baseURI + "1");
    await myNft.approve(market.target, 0);
    await myNft.approve(market.target, 1);
    await usdt.transfer(account2.address, "10000000000000000000000");
    await usdt.connect(account2).approve(market.target, "1000000000000000000000000");
  });

it('its erc20 address should be usdt', async function() {
  expect(await market.erc20()).to.equal(usdt.target);
});

it('its erc721 address should be myNft', async function() {
  expect(await market.erc721()).to.equal(myNft.target);
});

it('account1 should have 2 nfts', async function() {
  expect(await myNft.balanceOf(account1.address)).to.equal(2);
});

it('account2 should have 10000 USDT', async function() {
  expect(await usdt.balanceOf(account2.address)).to.equal("10000000000000000000000");
});

it('account2 should have 0 nfts', async function() {
  expect(await myNft.balanceOf(account2.address)).to.equal(0);
});

  it('account1 can list two nfts to market', async function() {
    const price = "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    await market.listNFT(0, price);
    await market.listNFT(0, price);

    const listedNFTs = await market.getListedNFTs();
    expect(listedNFTs).to.have.lengthOf(2);
    expect(listedNFTs[0].owner).to.equal(account1.address);
    expect(listedNFTs[1].owner).to.equal(account1.address);
  });

  it('account1 can unlist one nft from market', async function() {
    const price = "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    await market.listNFT(0, price);
    await market.listNFT(1, price);

    await market.unlistNFT(0);

    const listedNFTs = await market.getListedNFTs();
    expect(listedNFTs).to.have.lengthOf(1);
    expect(listedNFTs[0].owner).to.equal(account1.address);
  });

  it('account1 can change price of nft from market', async function() {
    const price = "0x0000000000000000000000000000000000000000000000000001c6bf52634000";
    const newPrice = "0x0000000000000000000000000000000000000000000000000002c6bf52634000";
    await market.listNFT(0, price);

    await market.changeNFTPrice(0, newPrice);

    const listedNFTs = await market.getListedNFTs();
    expect(listedNFTs).to.have.lengthOf(1);
    expect(listedNFTs[0].owner).to.equal(account1.address);

    const listedNFTPrice = await market.getNFTPrice(0);
    expect(listedNFTPrice).to.equal(newPrice);
  });

  it('account2 can buy nft from market', async function() {
    const price = "0x20";
    await market.listNFT(0, price);

    const balanceBefore = await usdt.balanceOf(account2.address);
    const ownerBefore = await myNft.ownerOf(0);

    await market.connect(account2).buyNFT(0,{
      value:"0x20"
    });

    const balanceAfter = await usdt.balanceOf(account2.address);
    const ownerAfter = await myNft.ownerOf(0);
    // 10000000000000000000000

    expect(ownerAfter).to.equal(account2.address);
  });
})

import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  
describe("CappedSet", function () {
    async function deploy() {
        const maxElements = 5;
        const [owner, account1, account2, account3, account4, account5 ] = await ethers.getSigners();
        const CappedSet = await ethers.getContractFactory("CappedSet");
        const cappedSet = await CappedSet.deploy(maxElements);
    
        return { cappedSet, maxElements, owner, account1, account2, account3, account4, account5 };
    }
  
    describe("Deployment", function () {
        it("Should set the right max value", async function () {
            const { cappedSet, maxElements } = await loadFixture(deploy);
            expect(await cappedSet.maxOfElements()).to.equal(maxElements);
        });
    });

    describe("Insert", function () {
        it("Should insert the first element correctly", async function () {
            const { cappedSet, account1 } = await loadFixture(deploy);
            const value1 = 150;
            await cappedSet.insert(account1.address, value1);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(value1);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
        });

        it("Should update lowest values per inserting", async function () {
            const { cappedSet, account1, account2, account3 } = await loadFixture(deploy);
            const value1 = 150;
            const value2 = 140;
            const value3 = 160;
            await cappedSet.insert(account1.address, value1);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(value1);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
            await cappedSet.insert(account2.address, value2);
            // Should update lowest value and address with account2's
            expect(await cappedSet.lowestAddress()).to.equal(account2.address);
            expect(await cappedSet.lowestValue()).to.equal(value2);
            expect(await cappedSet.getElementAddress(1)).to.equal(account2.address);
            await cappedSet.insert(account3.address, value3);
            // Should keep the current lowest element
            expect(await cappedSet.lowestAddress()).to.equal(account2.address);
            expect(await cappedSet.lowestValue()).to.equal(value2);
            expect(await cappedSet.getElementAddress(2)).to.equal(account3.address);
        });

        it("Should boost out the lowest element if the number of elements reachs out to the maximum", async function () {
            const { cappedSet, owner, account1, account2, account3, account4, account5 } = await loadFixture(deploy);
            const value = 100;
            const value1 = 150;
            const value2 = 140;
            const value3 = 160;
            const value4 = 170;
            const value5 = 180;
            await cappedSet.insert(owner.address, value);
            await cappedSet.insert(account1.address, value1);
            await cappedSet.insert(account2.address, value2);
            await cappedSet.insert(account3.address, value3);
            await cappedSet.insert(account4.address, value4);
            expect(await cappedSet.lowestAddress()).to.equal(owner.address);
            expect(await cappedSet.lowestValue()).to.equal(value);
            await cappedSet.insert(account5.address, value5);
            // Should boost out the lowest element and update with the new lowest element
            expect(await cappedSet.lowestAddress()).to.equal(account2.address);
            expect(await cappedSet.lowestValue()).to.equal(value2);
        });

        it("Should revert if the address already exists", async function () {
            const { cappedSet, account1 } = await loadFixture(deploy);
            const value1 = 150;
            await cappedSet.insert(account1.address, value1);
            await expect(cappedSet.insert(account1.address, value1)).to.be.revertedWithCustomError(cappedSet, "AlreadyExist");
        });
    });

    describe("Update", function () {
        it("Should update an element correctly when there is only one element", async function () {
            const { cappedSet, account1 } = await loadFixture(deploy);
            const value1 = 150;
            const newValue1 = 120;
            await cappedSet.insert(account1.address, value1);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(value1);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
            await cappedSet.update(account1.address, newValue1);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(newValue1);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
        });

        it("Should update an element and lowest element correctly when there are multiple elements", async function () {
            const { cappedSet, account1, account2 } = await loadFixture(deploy);
            const value1 = 150;
            const value2 = 130;
            const newValue1 = 120;
            await cappedSet.insert(account1.address, value1);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(value1);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
            await cappedSet.insert(account2.address, value2);
            expect(await cappedSet.lowestAddress()).to.equal(account2.address);
            expect(await cappedSet.lowestValue()).to.equal(value2);
            expect(await cappedSet.getElementAddress(1)).to.equal(account2.address);
            await cappedSet.update(account1.address, newValue1);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(newValue1);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
        });

        it("Should keep the lowest element if the updated value is greater than the current one", async function () {
            const { cappedSet, account1, account2 } = await loadFixture(deploy);
            const value1 = 120;
            const value2 = 130;
            const newValue1 = 170;
            await cappedSet.insert(account1.address, value1);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(value1);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
            await cappedSet.insert(account2.address, value2);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(value1);
            expect(await cappedSet.getElementAddress(1)).to.equal(account2.address);
            await cappedSet.update(account1.address, newValue1);
            expect(await cappedSet.lowestAddress()).to.equal(account2.address);
            expect(await cappedSet.lowestValue()).to.equal(value2);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
        });

        it("Should revert if the address is invalid", async function () {
            const { cappedSet, account1, account2 } = await loadFixture(deploy);
            const value1 = 150;
            const newValue1 = 170;
            await cappedSet.insert(account1.address, value1);
            await expect(cappedSet.update(account2.address, newValue1)).to.be.revertedWithCustomError(cappedSet, "InvalidAddress");
        });
    });

    describe("Remove", function () {
        it("Should remove an element correctly when there is only one element", async function () {
            const { cappedSet, account1 } = await loadFixture(deploy);
            const value1 = 150;
            await cappedSet.insert(account1.address, value1);
            expect(await cappedSet.lowestAddress()).to.equal(account1.address);
            expect(await cappedSet.lowestValue()).to.equal(value1);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
            await cappedSet.remove(account1.address);
            expect(await cappedSet.lowestAddress()).to.equal(ZERO_ADDRESS);
            expect(await cappedSet.lowestValue()).to.equal(0);
        });

        it("Should remove an element and update the lowest element correctly when there are multiple elements", async function () {
            const { cappedSet, account1, account2, account3 } = await loadFixture(deploy);
            const value1 = 150;
            const value2 = 120;
            const value3 = 110;
            await cappedSet.insert(account1.address, value1);
            await cappedSet.insert(account2.address, value2);
            await cappedSet.insert(account3.address, value3);
            expect(await cappedSet.lowestAddress()).to.equal(account3.address);
            expect(await cappedSet.lowestValue()).to.equal(value3);
            await cappedSet.remove(account3.address);
            expect(await cappedSet.lowestAddress()).to.equal(account2.address);
            expect(await cappedSet.lowestValue()).to.equal(value2);
        });

        it("Should keep the lowest element if the current lowest one is not being removed", async function () {
            const { cappedSet, account1, account2, account3 } = await loadFixture(deploy);
            const value1 = 150;
            const value2 = 120;
            const value3 = 110;
            await cappedSet.insert(account1.address, value1);
            await cappedSet.insert(account2.address, value2);
            await cappedSet.insert(account3.address, value3);
            expect(await cappedSet.lowestAddress()).to.equal(account3.address);
            expect(await cappedSet.lowestValue()).to.equal(value3);
            await cappedSet.remove(account2.address);
            expect(await cappedSet.lowestAddress()).to.equal(account3.address);
            expect(await cappedSet.lowestValue()).to.equal(value3);
        });

        it("Should revert if removing an invalid address", async function () {
            const { cappedSet, account1, account2, account3 } = await loadFixture(deploy);
            const value1 = 150;
            const value2 = 120;
            await cappedSet.insert(account1.address, value1);
            await cappedSet.insert(account2.address, value2);
            await expect(cappedSet.remove(account3.address)).to.be.revertedWithCustomError(cappedSet, "InvalidAddress");
        });
    });

    describe("View functions", function () {
        it("getValue", async function () {
            const { cappedSet, account1, account2 } = await loadFixture(deploy);
            const value1 = 150;
            const value2 = 120;
            await cappedSet.insert(account1.address, value1);
            await cappedSet.insert(account2.address, value2);
            expect(await cappedSet.getValue(account1.address)).to.equal(value1);
            expect(await cappedSet.getValue(account2.address)).to.equal(value2);
        });

        it("getElementAddress", async function () {
            const { cappedSet, account1, account2 } = await loadFixture(deploy);
            const value1 = 150;
            const value2 = 120;
            await cappedSet.insert(account1.address, value1);
            await cappedSet.insert(account2.address, value2);
            expect(await cappedSet.getElementAddress(0)).to.equal(account1.address);
            expect(await cappedSet.getElementAddress(1)).to.equal(account2.address);
        });
    });
});
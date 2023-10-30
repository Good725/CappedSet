// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

error AlreadyExist();
error InvalidAddress();

contract CappedSet {
    using EnumerableSet for EnumerableSet.AddressSet;

    uint public immutable maxOfElements;
    uint public lowestValue;
    address public lowestAddress;
    mapping(address => uint) public elements;
    EnumerableSet.AddressSet internal elementsAddresses;

    constructor(uint numElements) {
        maxOfElements = numElements;
    }

    function insert(address addr, uint value) external returns (address newLowestAddress, uint newLowestValue) {
        if (elementsAddresses.add(addr)) {
            elements[addr] = value;
            if (elementsAddresses.length() == 1) {
                lowestValue = value;
                lowestAddress = addr;
                return (address(0), 0);
            }
            if (elementsAddresses.length() > maxOfElements) {
                address currentLowestAddress = lowestAddress;
                delete elements[currentLowestAddress];
                elementsAddresses.remove(currentLowestAddress);
            }
            updateNewLowestAddress();
            return (lowestAddress, lowestValue);
        } else {
            revert AlreadyExist();
        }
    }

    function update(address addr, uint newVal) external returns (address newLowestAddress, uint newLowestValue) {
        if (!elementsAddresses.contains(addr)) revert InvalidAddress();
        elements[addr] = newVal;

        if (newVal < lowestValue) {
            lowestValue = newVal;
            lowestAddress = addr;
            return (addr, newVal);
        } else {
            if (lowestAddress == addr) {
                updateNewLowestAddress();
            }
            return (lowestAddress, lowestValue);
        }
    }

    function remove(address addr) external returns (address newLowestAddress, uint newLowestValue) {
        delete elements[addr];
        if (!elementsAddresses.remove(addr)) revert InvalidAddress();
        if (elementsAddresses.length() == 0) {
            lowestValue = 0;
            lowestAddress = address(0);
            return (address(0), 0);
        }
        if (lowestAddress == addr) {
            updateNewLowestAddress();
        }
        return (lowestAddress, lowestValue);
    }

    function getValue(address addr) external view returns (uint) {
        return elements[addr];
    }

    function getElementAddress(uint index) external view returns (address) {
        return elementsAddresses.at(index);
    }

    function updateNewLowestAddress() internal {
        uint length = elementsAddresses.length();
        uint newLowestValue = elements[elementsAddresses.at(0)];
        uint lowestIndex;
        for (uint i = 1; i < length; i++) {
            if (elements[elementsAddresses.at(i)] < newLowestValue) {
                newLowestValue = elements[elementsAddresses.at(i)];
                lowestIndex = i;
            }
        }
        lowestAddress = elementsAddresses.at(lowestIndex);
        lowestValue = newLowestValue;
    }
}

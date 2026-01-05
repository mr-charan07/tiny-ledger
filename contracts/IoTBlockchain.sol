// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract IoTBlockchain {
    address public owner;
    uint256 public dataCount;
    uint256 public deviceCount;
    uint256 public nodeCount;

    struct IoTData {
        uint256 id;
        address device;
        bytes32 dataHash;
        uint256 timestamp;
    }

    struct Device {
        address addr;
        bytes32 name;
        bool active;
        uint8 permission;
    }

    struct Node {
        address addr;
        bytes32 name;
        bool active;
        bool isValidator;
    }

    mapping(uint256 => IoTData) public dataRecords;
    mapping(address => Device) public devices;
    mapping(address => Node) public nodes;
    address[] public deviceList;
    address[] public nodeList;

    event DataRecorded(uint256 indexed id, address indexed device, bytes32 dataHash);
    event DeviceRegistered(address indexed device, bytes32 name);
    event NodeRegistered(address indexed node, bytes32 name);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        nodes[msg.sender] = Node(msg.sender, "Primary", true, true);
        nodeList.push(msg.sender);
        nodeCount = 1;
    }

    function registerDevice(address _addr, bytes32 _name, uint8 _perm) external onlyOwner {
        require(devices[_addr].addr == address(0), "Exists");
        devices[_addr] = Device(_addr, _name, true, _perm);
        deviceList.push(_addr);
        deviceCount++;
        emit DeviceRegistered(_addr, _name);
    }

    function registerNode(address _addr, bytes32 _name, bool _validator) external onlyOwner {
        require(nodes[_addr].addr == address(0), "Exists");
        nodes[_addr] = Node(_addr, _name, true, _validator);
        nodeList.push(_addr);
        nodeCount++;
        emit NodeRegistered(_addr, _name);
    }

    function recordData(bytes32 _hash) external {
        Device storage d = devices[msg.sender];
        require(d.active && d.permission >= 2 || msg.sender == owner, "No access");
        dataCount++;
        dataRecords[dataCount] = IoTData(dataCount, msg.sender, _hash, block.timestamp);
        emit DataRecorded(dataCount, msg.sender, _hash);
    }

    function setDeviceStatus(address _addr, bool _active) external onlyOwner {
        devices[_addr].active = _active;
    }

    function setNodeStatus(address _addr, bool _active) external onlyOwner {
        nodes[_addr].active = _active;
    }

    function getData(uint256 _id) external view returns (IoTData memory) {
        return dataRecords[_id];
    }

    function getRecentData(uint256 _count) external view returns (IoTData[] memory) {
        uint256 len = _count > dataCount ? dataCount : _count;
        IoTData[] memory result = new IoTData[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = dataRecords[dataCount - i];
        }
        return result;
    }

    function getAllDevices() external view returns (Device[] memory) {
        Device[] memory result = new Device[](deviceCount);
        for (uint256 i = 0; i < deviceCount; i++) {
            result[i] = devices[deviceList[i]];
        }
        return result;
    }

    function getAllNodes() external view returns (Node[] memory) {
        Node[] memory result = new Node[](nodeCount);
        for (uint256 i = 0; i < nodeCount; i++) {
            result[i] = nodes[nodeList[i]];
        }
        return result;
    }

    function getStats() external view returns (uint256, uint256, uint256, uint256, uint256) {
        uint256 activeDevices;
        uint256 activeNodes;
        for (uint256 i = 0; i < deviceCount; i++) {
            if (devices[deviceList[i]].active) activeDevices++;
        }
        for (uint256 i = 0; i < nodeCount; i++) {
            if (nodes[nodeList[i]].active) activeNodes++;
        }
        return (dataCount, deviceCount, nodeCount, activeDevices, activeNodes);
    }
}

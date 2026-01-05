// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract IoTBlockchain {
    address public owner;
    uint256 public dataCount;
    uint256 public deviceCount;
    uint256 public nodeCount;

    struct Device {
        bytes32 name;
        bool active;
        uint8 perm;
    }

    struct Node {
        bytes32 name;
        bool active;
        bool validator;
    }

    struct DataRecord {
        address device;
        bytes32 dataHash;
        uint256 timestamp;
    }

    mapping(uint256 => DataRecord) public records;
    mapping(address => Device) public devices;
    mapping(address => Node) public nodes;
    address[] public deviceList;
    address[] public nodeList;

    event DataRecorded(uint256 indexed id, address indexed device, bytes32 dataHash);
    event DeviceAdded(address indexed device, bytes32 name);
    event NodeAdded(address indexed node, bytes32 name);

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        nodes[msg.sender] = Node("Primary", true, true);
        nodeList.push(msg.sender);
        nodeCount = 1;
    }

    function addDevice(address _addr, bytes32 _name, uint8 _perm) external onlyOwner {
        require(devices[_addr].name == bytes32(0), "exists");
        devices[_addr] = Device(_name, true, _perm);
        deviceList.push(_addr);
        deviceCount++;
        emit DeviceAdded(_addr, _name);
    }

    function addNode(address _addr, bytes32 _name, bool _validator) external onlyOwner {
        require(nodes[_addr].name == bytes32(0), "exists");
        nodes[_addr] = Node(_name, true, _validator);
        nodeList.push(_addr);
        nodeCount++;
        emit NodeAdded(_addr, _name);
    }

    function record(bytes32 _hash) external {
        Device storage d = devices[msg.sender];
        require((d.active && d.perm >= 2) || msg.sender == owner, "!auth");
        unchecked { dataCount++; }
        records[dataCount] = DataRecord(msg.sender, _hash, block.timestamp);
        emit DataRecorded(dataCount, msg.sender, _hash);
    }

    function setDeviceActive(address _addr, bool _active) external onlyOwner {
        devices[_addr].active = _active;
    }

    function setNodeActive(address _addr, bool _active) external onlyOwner {
        nodes[_addr].active = _active;
    }

    function getRecord(uint256 _id) external view returns (address, bytes32, uint256) {
        DataRecord storage r = records[_id];
        return (r.device, r.dataHash, r.timestamp);
    }

    function getDevice(address _addr) external view returns (bytes32, bool, uint8) {
        Device storage d = devices[_addr];
        return (d.name, d.active, d.perm);
    }

    function getNode(address _addr) external view returns (bytes32, bool, bool) {
        Node storage n = nodes[_addr];
        return (n.name, n.active, n.validator);
    }

    function getDeviceAt(uint256 _index) external view returns (address) {
        return deviceList[_index];
    }

    function getNodeAt(uint256 _index) external view returns (address) {
        return nodeList[_index];
    }
}

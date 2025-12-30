// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IoTBlockchain
 * @dev Lightweight permissioned blockchain for IoT data recording
 * @notice Deploy with optimizer enabled: runs=200
 */
contract IoTBlockchain {
    
    // ==================== STRUCTS ====================
    
    struct IoTData {
        uint256 id;
        address deviceAddress;
        string deviceName;
        string dataType;
        int256 value;
        uint256 timestamp;
        bytes32 signature;
    }
    
    struct Device {
        address deviceAddress;
        string name;
        string deviceType;
        bool isActive;
        uint256 registeredAt;
        uint256 transactionCount;
        uint8 permission; // 0=READ, 1=WRITE, 2=ADMIN
    }
    
    struct Node {
        address nodeAddress;
        string name;
        bool isValidator;
        bool isActive;
        uint256 blocksValidated;
        uint256 lastSeen;
    }
    
    // ==================== STATE VARIABLES ====================
    
    address public owner;
    uint256 public dataCount;
    uint256 public deviceCount;
    uint256 public nodeCount;
    
    mapping(uint256 => IoTData) private iotDataRecords;
    mapping(address => Device) private devices;
    mapping(address => Node) private nodes;
    mapping(address => bool) public authorizedDevices;
    mapping(address => bool) public authorizedNodes;
    
    address[] private deviceAddresses;
    address[] private nodeAddresses;
    
    // ==================== EVENTS ====================
    
    event DataRecorded(uint256 indexed id, address indexed device, string deviceName, string dataType, int256 value, uint256 timestamp);
    event DeviceRegistered(address indexed deviceAddress, string name, string deviceType, uint8 permission);
    event DeviceStatusChanged(address indexed deviceAddress, bool isActive);
    event NodeRegistered(address indexed nodeAddress, string name, bool isValidator);
    event NodeStatusChanged(address indexed nodeAddress, bool isActive);
    event PermissionChanged(address indexed deviceAddress, uint8 newPermission);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        owner = msg.sender;
        nodes[msg.sender] = Node(msg.sender, "Primary", true, true, 0, block.timestamp);
        authorizedNodes[msg.sender] = true;
        nodeAddresses.push(msg.sender);
        nodeCount = 1;
    }
    
    // ==================== DEVICE MANAGEMENT ====================
    
    function registerDevice(address _addr, string calldata _name, string calldata _type, uint8 _perm) external onlyOwner {
        require(!authorizedDevices[_addr], "Exists");
        devices[_addr] = Device(_addr, _name, _type, true, block.timestamp, 0, _perm);
        authorizedDevices[_addr] = true;
        deviceAddresses.push(_addr);
        deviceCount++;
        emit DeviceRegistered(_addr, _name, _type, _perm);
    }
    
    function setDeviceStatus(address _addr, bool _active) external onlyOwner {
        require(authorizedDevices[_addr], "Not found");
        devices[_addr].isActive = _active;
        emit DeviceStatusChanged(_addr, _active);
    }
    
    function setDevicePermission(address _addr, uint8 _perm) external onlyOwner {
        require(authorizedDevices[_addr], "Not found");
        devices[_addr].permission = _perm;
        emit PermissionChanged(_addr, _perm);
    }
    
    // ==================== NODE MANAGEMENT ====================
    
    function registerNode(address _addr, string calldata _name, bool _isValidator) external onlyOwner {
        require(!authorizedNodes[_addr], "Exists");
        nodes[_addr] = Node(_addr, _name, _isValidator, true, 0, block.timestamp);
        authorizedNodes[_addr] = true;
        nodeAddresses.push(_addr);
        nodeCount++;
        emit NodeRegistered(_addr, _name, _isValidator);
    }
    
    function setNodeStatus(address _addr, bool _active) external onlyOwner {
        require(authorizedNodes[_addr], "Not found");
        nodes[_addr].isActive = _active;
        emit NodeStatusChanged(_addr, _active);
    }
    
    function updateNodeLastSeen(address _addr) external {
        require(msg.sender == _addr || msg.sender == owner, "Denied");
        nodes[_addr].lastSeen = block.timestamp;
    }
    
    // ==================== DATA RECORDING ====================
    
    function recordData(string calldata _deviceName, string calldata _dataType, int256 _value, bytes32 _sig) external returns (uint256) {
        require(authorizedDevices[msg.sender] || msg.sender == owner, "Not authorized");
        require(devices[msg.sender].isActive || msg.sender == owner, "Inactive");
        require(devices[msg.sender].permission >= 1 || msg.sender == owner, "No write");
        
        dataCount++;
        iotDataRecords[dataCount] = IoTData(dataCount, msg.sender, _deviceName, _dataType, _value, block.timestamp, _sig);
        
        if (authorizedDevices[msg.sender]) {
            devices[msg.sender].transactionCount++;
        }
        
        emit DataRecorded(dataCount, msg.sender, _deviceName, _dataType, _value, block.timestamp);
        return dataCount;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function getDataRecord(uint256 _id) external view returns (IoTData memory) {
        require(_id > 0 && _id <= dataCount, "Invalid");
        return iotDataRecords[_id];
    }
    
    function getRecentData(uint256 _count) external view returns (IoTData[] memory) {
        uint256 count = _count > dataCount ? dataCount : _count;
        IoTData[] memory result = new IoTData[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = iotDataRecords[dataCount - i];
        }
        return result;
    }
    
    function getAllDevices() external view returns (Device[] memory) {
        Device[] memory result = new Device[](deviceCount);
        for (uint256 i = 0; i < deviceCount; i++) {
            result[i] = devices[deviceAddresses[i]];
        }
        return result;
    }
    
    function getAllNodes() external view returns (Node[] memory) {
        Node[] memory result = new Node[](nodeCount);
        for (uint256 i = 0; i < nodeCount; i++) {
            result[i] = nodes[nodeAddresses[i]];
        }
        return result;
    }
    
    function getDevice(address _addr) external view returns (Device memory) {
        return devices[_addr];
    }
    
    function getNode(address _addr) external view returns (Node memory) {
        return nodes[_addr];
    }
    
    function getStats() external view returns (uint256, uint256, uint256, uint256, uint256) {
        uint256 activeD = 0;
        uint256 activeN = 0;
        for (uint256 i = 0; i < deviceCount; i++) {
            if (devices[deviceAddresses[i]].isActive) activeD++;
        }
        for (uint256 i = 0; i < nodeCount; i++) {
            if (nodes[nodeAddresses[i]].isActive) activeN++;
        }
        return (dataCount, deviceCount, nodeCount, activeD, activeN);
    }
    
    // ==================== OWNER FUNCTIONS ====================
    
    function transferOwnership(address _new) external onlyOwner {
        require(_new != address(0), "Zero");
        owner = _new;
    }
}

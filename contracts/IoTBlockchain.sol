// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IoTBlockchain
 * @dev Lightweight permissioned blockchain for IoT data recording
 * @notice Deploy this contract to Sepolia testnet and add the address to the app
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
        string deviceType; // sensor, actuator, gateway
        bool isActive;
        uint256 registeredAt;
        uint256 transactionCount;
        Permission permission;
    }
    
    struct Node {
        address nodeAddress;
        string name;
        bool isValidator;
        bool isActive;
        uint256 blocksValidated;
        uint256 lastSeen;
    }
    
    enum Permission { READ, WRITE, ADMIN }
    
    // ==================== STATE VARIABLES ====================
    
    address public owner;
    uint256 public dataCount;
    uint256 public deviceCount;
    uint256 public nodeCount;
    
    mapping(uint256 => IoTData) public iotDataRecords;
    mapping(address => Device) public devices;
    mapping(address => Node) public nodes;
    mapping(address => bool) public authorizedDevices;
    mapping(address => bool) public authorizedNodes;
    
    address[] public deviceAddresses;
    address[] public nodeAddresses;
    uint256[] public dataIds;
    
    // ==================== EVENTS ====================
    
    event DataRecorded(
        uint256 indexed id,
        address indexed device,
        string deviceName,
        string dataType,
        int256 value,
        uint256 timestamp
    );
    
    event DeviceRegistered(
        address indexed deviceAddress,
        string name,
        string deviceType,
        Permission permission
    );
    
    event DeviceStatusChanged(address indexed deviceAddress, bool isActive);
    
    event NodeRegistered(
        address indexed nodeAddress,
        string name,
        bool isValidator
    );
    
    event NodeStatusChanged(address indexed nodeAddress, bool isActive);
    
    event PermissionChanged(address indexed deviceAddress, Permission newPermission);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyAuthorizedDevice() {
        require(authorizedDevices[msg.sender] || msg.sender == owner, "Device not authorized");
        _;
    }
    
    modifier onlyValidator() {
        require(
            (authorizedNodes[msg.sender] && nodes[msg.sender].isValidator) || msg.sender == owner,
            "Only validators can call this function"
        );
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        owner = msg.sender;
        
        // Register owner as first validator node
        nodes[msg.sender] = Node({
            nodeAddress: msg.sender,
            name: "Primary Validator",
            isValidator: true,
            isActive: true,
            blocksValidated: 0,
            lastSeen: block.timestamp
        });
        authorizedNodes[msg.sender] = true;
        nodeAddresses.push(msg.sender);
        nodeCount = 1;
    }
    
    // ==================== DEVICE MANAGEMENT ====================
    
    function registerDevice(
        address _deviceAddress,
        string memory _name,
        string memory _deviceType,
        Permission _permission
    ) external onlyOwner {
        require(!authorizedDevices[_deviceAddress], "Device already registered");
        
        devices[_deviceAddress] = Device({
            deviceAddress: _deviceAddress,
            name: _name,
            deviceType: _deviceType,
            isActive: true,
            registeredAt: block.timestamp,
            transactionCount: 0,
            permission: _permission
        });
        
        authorizedDevices[_deviceAddress] = true;
        deviceAddresses.push(_deviceAddress);
        deviceCount++;
        
        emit DeviceRegistered(_deviceAddress, _name, _deviceType, _permission);
    }
    
    function setDeviceStatus(address _deviceAddress, bool _isActive) external onlyOwner {
        require(authorizedDevices[_deviceAddress], "Device not registered");
        devices[_deviceAddress].isActive = _isActive;
        emit DeviceStatusChanged(_deviceAddress, _isActive);
    }
    
    function setDevicePermission(address _deviceAddress, Permission _permission) external onlyOwner {
        require(authorizedDevices[_deviceAddress], "Device not registered");
        devices[_deviceAddress].permission = _permission;
        emit PermissionChanged(_deviceAddress, _permission);
    }
    
    // ==================== NODE MANAGEMENT ====================
    
    function registerNode(
        address _nodeAddress,
        string memory _name,
        bool _isValidator
    ) external onlyOwner {
        require(!authorizedNodes[_nodeAddress], "Node already registered");
        
        nodes[_nodeAddress] = Node({
            nodeAddress: _nodeAddress,
            name: _name,
            isValidator: _isValidator,
            isActive: true,
            blocksValidated: 0,
            lastSeen: block.timestamp
        });
        
        authorizedNodes[_nodeAddress] = true;
        nodeAddresses.push(_nodeAddress);
        nodeCount++;
        
        emit NodeRegistered(_nodeAddress, _name, _isValidator);
    }
    
    function setNodeStatus(address _nodeAddress, bool _isActive) external onlyOwner {
        require(authorizedNodes[_nodeAddress], "Node not registered");
        nodes[_nodeAddress].isActive = _isActive;
        emit NodeStatusChanged(_nodeAddress, _isActive);
    }
    
    function updateNodeLastSeen(address _nodeAddress) external {
        require(authorizedNodes[_nodeAddress], "Node not registered");
        require(msg.sender == _nodeAddress || msg.sender == owner, "Can only update own status");
        nodes[_nodeAddress].lastSeen = block.timestamp;
    }
    
    // ==================== DATA RECORDING ====================
    
    function recordData(
        string memory _deviceName,
        string memory _dataType,
        int256 _value,
        bytes32 _signature
    ) external onlyAuthorizedDevice returns (uint256) {
        require(devices[msg.sender].isActive || msg.sender == owner, "Device is not active");
        require(
            devices[msg.sender].permission >= Permission.WRITE || msg.sender == owner,
            "Device does not have write permission"
        );
        
        dataCount++;
        
        iotDataRecords[dataCount] = IoTData({
            id: dataCount,
            deviceAddress: msg.sender,
            deviceName: _deviceName,
            dataType: _dataType,
            value: _value,
            timestamp: block.timestamp,
            signature: _signature
        });
        
        dataIds.push(dataCount);
        
        if (authorizedDevices[msg.sender]) {
            devices[msg.sender].transactionCount++;
        }
        
        emit DataRecorded(dataCount, msg.sender, _deviceName, _dataType, _value, block.timestamp);
        
        return dataCount;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function getDataRecord(uint256 _id) external view returns (IoTData memory) {
        require(_id > 0 && _id <= dataCount, "Invalid data ID");
        return iotDataRecords[_id];
    }
    
    function getRecentData(uint256 _count) external view returns (IoTData[] memory) {
        uint256 count = _count > dataCount ? dataCount : _count;
        IoTData[] memory recentData = new IoTData[](count);
        
        for (uint256 i = 0; i < count; i++) {
            recentData[i] = iotDataRecords[dataCount - i];
        }
        
        return recentData;
    }
    
    function getAllDevices() external view returns (Device[] memory) {
        Device[] memory allDevices = new Device[](deviceCount);
        for (uint256 i = 0; i < deviceCount; i++) {
            allDevices[i] = devices[deviceAddresses[i]];
        }
        return allDevices;
    }
    
    function getAllNodes() external view returns (Node[] memory) {
        Node[] memory allNodes = new Node[](nodeCount);
        for (uint256 i = 0; i < nodeCount; i++) {
            allNodes[i] = nodes[nodeAddresses[i]];
        }
        return allNodes;
    }
    
    function getDevice(address _deviceAddress) external view returns (Device memory) {
        require(authorizedDevices[_deviceAddress], "Device not registered");
        return devices[_deviceAddress];
    }
    
    function getNode(address _nodeAddress) external view returns (Node memory) {
        require(authorizedNodes[_nodeAddress], "Node not registered");
        return nodes[_nodeAddress];
    }
    
    function getStats() external view returns (
        uint256 totalData,
        uint256 totalDevices,
        uint256 totalNodes,
        uint256 activeDevices,
        uint256 activeNodes
    ) {
        uint256 _activeDevices = 0;
        uint256 _activeNodes = 0;
        
        for (uint256 i = 0; i < deviceCount; i++) {
            if (devices[deviceAddresses[i]].isActive) {
                _activeDevices++;
            }
        }
        
        for (uint256 i = 0; i < nodeCount; i++) {
            if (nodes[nodeAddresses[i]].isActive) {
                _activeNodes++;
            }
        }
        
        return (dataCount, deviceCount, nodeCount, _activeDevices, _activeNodes);
    }
    
    // ==================== OWNER FUNCTIONS ====================
    
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}

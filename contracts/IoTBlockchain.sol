// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IoTBlockchain
 * @dev Compact, permissioned IoT data registry designed to stay under the EIP-3860 initcode limit.
 * @notice Deploy with optimizer enabled (Remix: Solidity Compiler -> Advanced -> Enable Optimization).
 */
contract IoTBlockchain {
    // ---- Custom errors (smaller than revert strings) ----
    error NotOwner();
    error AlreadyRegistered();
    error NotRegistered();
    error NotAuthorized();
    error Inactive();
    error NoWritePermission();
    error InvalidId();
    error InvalidAddress();

    // ---- Data structures ----
    struct IoTData {
        uint256 id;
        address deviceAddress;
        bytes32 deviceName;
        bytes32 dataType;
        int256 value;
        uint256 timestamp;
        bytes32 signature;
    }

    struct Device {
        address deviceAddress;
        bytes32 name;
        bytes32 deviceType; // e.g. "sensor", "actuator", "gateway"
        bool isActive;
        uint256 registeredAt;
        uint256 transactionCount;
        uint8 permission; // 0=READ, 1=WRITE, 2=ADMIN
    }

    struct Node {
        address nodeAddress;
        bytes32 name;
        bool isValidator;
        bool isActive;
        uint256 blocksValidated;
        uint256 lastSeen;
    }

    // ---- State ----
    address public owner;
    uint256 public dataCount;
    uint256 public deviceCount;
    uint256 public nodeCount;

    mapping(uint256 => IoTData) private dataRecords;
    mapping(address => Device) private deviceByAddress;
    mapping(address => Node) private nodeByAddress;

    mapping(address => bool) public authorizedDevices;
    mapping(address => bool) public authorizedNodes;

    address[] private deviceAddresses;
    address[] private nodeAddresses;

    // ---- Events ----
    event DataRecorded(
        uint256 indexed id,
        address indexed device,
        bytes32 deviceName,
        bytes32 dataType,
        int256 value,
        uint256 timestamp
    );

    event DeviceRegistered(address indexed deviceAddress, bytes32 name, bytes32 deviceType, uint8 permission);
    event DeviceStatusChanged(address indexed deviceAddress, bool isActive);
    event NodeRegistered(address indexed nodeAddress, bytes32 name, bool isValidator);
    event NodeStatusChanged(address indexed nodeAddress, bool isActive);
    event PermissionChanged(address indexed deviceAddress, uint8 newPermission);

    // ---- Modifiers ----
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ---- Constructor ----
    constructor() {
        owner = msg.sender;

        // register deployer as initial validator node
        nodeByAddress[msg.sender] = Node({
            nodeAddress: msg.sender,
            name: bytes32("PRIMARY_VALIDATOR"),
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

    function registerDevice(address _deviceAddress, bytes32 _name, bytes32 _deviceType, uint8 _permission) external onlyOwner {
        if (authorizedDevices[_deviceAddress]) revert AlreadyRegistered();

        deviceByAddress[_deviceAddress] = Device({
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
        unchecked {
            deviceCount++;
        }

        emit DeviceRegistered(_deviceAddress, _name, _deviceType, _permission);
    }

    function setDeviceStatus(address _deviceAddress, bool _isActive) external onlyOwner {
        if (!authorizedDevices[_deviceAddress]) revert NotRegistered();
        deviceByAddress[_deviceAddress].isActive = _isActive;
        emit DeviceStatusChanged(_deviceAddress, _isActive);
    }

    function setDevicePermission(address _deviceAddress, uint8 _permission) external onlyOwner {
        if (!authorizedDevices[_deviceAddress]) revert NotRegistered();
        deviceByAddress[_deviceAddress].permission = _permission;
        emit PermissionChanged(_deviceAddress, _permission);
    }

    // ==================== NODE MANAGEMENT ====================

    function registerNode(address _nodeAddress, bytes32 _name, bool _isValidator) external onlyOwner {
        if (authorizedNodes[_nodeAddress]) revert AlreadyRegistered();

        nodeByAddress[_nodeAddress] = Node({
            nodeAddress: _nodeAddress,
            name: _name,
            isValidator: _isValidator,
            isActive: true,
            blocksValidated: 0,
            lastSeen: block.timestamp
        });

        authorizedNodes[_nodeAddress] = true;
        nodeAddresses.push(_nodeAddress);
        unchecked {
            nodeCount++;
        }

        emit NodeRegistered(_nodeAddress, _name, _isValidator);
    }

    function setNodeStatus(address _nodeAddress, bool _isActive) external onlyOwner {
        if (!authorizedNodes[_nodeAddress]) revert NotRegistered();
        nodeByAddress[_nodeAddress].isActive = _isActive;
        emit NodeStatusChanged(_nodeAddress, _isActive);
    }

    function updateNodeLastSeen(address _nodeAddress) external {
        if (!authorizedNodes[_nodeAddress]) revert NotRegistered();
        if (msg.sender != _nodeAddress && msg.sender != owner) revert NotAuthorized();
        nodeByAddress[_nodeAddress].lastSeen = block.timestamp;
    }

    // ==================== DATA RECORDING ====================

    function recordData(bytes32 _deviceName, bytes32 _dataType, int256 _value, bytes32 _signature)
        external
        returns (uint256)
    {
        if (!authorizedDevices[msg.sender] && msg.sender != owner) revert NotAuthorized();

        if (msg.sender != owner) {
            Device storage d = deviceByAddress[msg.sender];
            if (!d.isActive) revert Inactive();
            if (d.permission < 1) revert NoWritePermission();
            unchecked {
                d.transactionCount++;
            }
        }

        unchecked {
            dataCount++;
        }

        dataRecords[dataCount] = IoTData({
            id: dataCount,
            deviceAddress: msg.sender,
            deviceName: _deviceName,
            dataType: _dataType,
            value: _value,
            timestamp: block.timestamp,
            signature: _signature
        });

        emit DataRecorded(dataCount, msg.sender, _deviceName, _dataType, _value, block.timestamp);
        return dataCount;
    }

    // ==================== VIEW FUNCTIONS ====================

    function getDataRecord(uint256 _id) external view returns (IoTData memory) {
        if (_id == 0 || _id > dataCount) revert InvalidId();
        return dataRecords[_id];
    }

    function getRecentData(uint256 _count) external view returns (IoTData[] memory) {
        uint256 count = _count > dataCount ? dataCount : _count;
        IoTData[] memory recent = new IoTData[](count);

        for (uint256 i = 0; i < count; i++) {
            recent[i] = dataRecords[dataCount - i];
        }

        return recent;
    }

    function getAllDevices() external view returns (Device[] memory) {
        Device[] memory result = new Device[](deviceCount);
        for (uint256 i = 0; i < deviceCount; i++) {
            result[i] = deviceByAddress[deviceAddresses[i]];
        }
        return result;
    }

    function getAllNodes() external view returns (Node[] memory) {
        Node[] memory result = new Node[](nodeCount);
        for (uint256 i = 0; i < nodeCount; i++) {
            result[i] = nodeByAddress[nodeAddresses[i]];
        }
        return result;
    }

    function getDevice(address _deviceAddress) external view returns (Device memory) {
        if (!authorizedDevices[_deviceAddress]) revert NotRegistered();
        return deviceByAddress[_deviceAddress];
    }

    function getNode(address _nodeAddress) external view returns (Node memory) {
        if (!authorizedNodes[_nodeAddress]) revert NotRegistered();
        return nodeByAddress[_nodeAddress];
    }

    function getStats() external view returns (uint256 totalData, uint256 totalDevices, uint256 totalNodes, uint256 activeDevices, uint256 activeNodes) {
        uint256 aD = 0;
        uint256 aN = 0;

        for (uint256 i = 0; i < deviceCount; i++) {
            if (deviceByAddress[deviceAddresses[i]].isActive) aD++;
        }

        for (uint256 i = 0; i < nodeCount; i++) {
            if (nodeByAddress[nodeAddresses[i]].isActive) aN++;
        }

        return (dataCount, deviceCount, nodeCount, aD, aN);
    }

    // ==================== OWNER FUNCTIONS ====================

    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert InvalidAddress();
        owner = _newOwner;
    }
}

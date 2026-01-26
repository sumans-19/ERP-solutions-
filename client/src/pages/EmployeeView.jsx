import React, { useState, useEffect, useRef } from "react";
import {
  getEmployeeOrders,
  getEmployeeOrderStats,
  updateOrderProgress,
  getConversation,
  getEmployees,
  sendMessage,
  markMessagesAsRead
} from "../services/employeeApi";

export default function EmployeeView() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [orders, setOrders] = useState({
    completed: 0,
    inProgress: 0,
    notStarted: 0,
  });
  const [loading, setLoading] = useState(false);
  const [currentUserId] = useState("EMP-12345"); // Get from auth context in real app
  
  // Chat state
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [messages, setMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState("");
  const chatEndRef = useRef(null);

  // Chatbot state
  const [chatbotMessages, setChatbotMessages] = useState([
    { type: "bot", text: "Hello! I'm here to help you. How can I assist you today?" }
  ]);
  const [chatbotInput, setChatbotInput] = useState("");

  // Employees state
  const [employees, setEmployees] = useState([]);

  // Assigned orders state
  const [assignedOrders, setAssignedOrders] = useState([]);

  // Load employee data
  useEffect(() => {
    loadEmployees();
  }, []);

  // Load orders and stats
  useEffect(() => {
    if (activeTab === "dashboard" || activeTab === "assigned") {
      loadOrdersAndStats();
    }
  }, [activeTab]);

  // Load conversation when employee selected
  useEffect(() => {
    if (selectedEmployee) {
      loadConversation(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const response = await getEmployees();
      if (response.employees) {
        const employeeList = response.employees.map(emp => ({
          id: emp.employeeId || emp._id,
          name: emp.name,
          role: emp.position || emp.role,
          status: emp.status === 'Active' ? 'online' : 'offline'
        }));
        setEmployees(employeeList);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      // Fallback to dummy data
      setEmployees([
        { id: 1, name: "John Smith", role: "Production Manager", status: "online" },
        { id: 2, name: "Sarah Johnson", role: "Quality Inspector", status: "online" },
        { id: 3, name: "Mike Williams", role: "Team Lead", status: "offline" },
        { id: 4, name: "Emily Brown", role: "Assembly Worker", status: "online" },
        { id: 5, name: "David Lee", role: "Planning Manager", status: "offline" },
      ]);
    }
  };

  const loadOrdersAndStats = async () => {
    setLoading(true);
    try {
      // Load orders
      const ordersResponse = await getEmployeeOrders(currentUserId);
      if (ordersResponse.data.success && ordersResponse.data.orders) {
        const formattedOrders = ordersResponse.data.orders.map(order => ({
          id: order._id,
          orderNo: order.poNumber || `ORD-${order._id.slice(-6)}`,
          itemName: order.items?.[0]?.itemName || 'N/A',
          customer: order.partyName,
          assignedDate: order.assignedDate ? new Date(order.assignedDate).toISOString().split('T')[0] : new Date(order.createdAt).toISOString().split('T')[0],
          dueDate: order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0] : 'N/A',
          status: order.status === 'Processing' ? 'in-progress' : order.status === 'New' ? 'not-started' : order.status.toLowerCase(),
          priority: order.items?.[0]?.priority?.toLowerCase() || 'normal',
          completionPercent: order.completionPercent || 0,
        }));
        setAssignedOrders(formattedOrders);
      }

      // Load stats
      const statsResponse = await getEmployeeOrderStats(currentUserId);
      if (statsResponse.data.success && statsResponse.data.stats) {
        const stats = statsResponse.data.stats;
        setOrders({
          completed: stats.completed || 0,
          inProgress: stats.inProgress || 0,
          notStarted: stats.notStarted || 0,
        });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      // Fallback to dummy data
      setAssignedOrders([
        {
          id: 1,
          orderNo: "ORD-001",
          itemName: "Steel Chair Frame",
          customer: "Furniture Corp",
          assignedDate: "2026-01-20",
          dueDate: "2026-01-28",
          status: "in-progress",
          priority: "high",
          completionPercent: 65,
        },
        {
          id: 2,
          orderNo: "ORD-002",
          itemName: "Office Desk",
          customer: "Office Solutions Ltd",
          assignedDate: "2026-01-22",
          dueDate: "2026-01-30",
          status: "not-started",
          priority: "medium",
          completionPercent: 0,
        },
      ]);
      setOrders({ completed: 45, inProgress: 23, notStarted: 12 });
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (employeeId) => {
    try {
      const response = await getConversation(currentUserId, employeeId.toString());
      if (response.data.success && response.data.messages) {
        const formattedMessages = response.data.messages.map(msg => ({
          id: msg._id,
          text: msg.text,
          sender: msg.senderId === currentUserId ? 'me' : 'them',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(prev => ({
          ...prev,
          [String(employeeId)]: formattedMessages
        }));
        
        // Mark messages as read
        await markMessagesAsRead(currentUserId, employeeId.toString());
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Initialize empty array for this conversation
      setMessages(prev => ({
        ...prev,
        [String(employeeId)]: []
      }));
    }
  };

  const handleUpdateProgress = async (orderId, newPercent, newStatus) => {
    try {
      const response = await updateOrderProgress(orderId, {
        completionPercent: newPercent,
        status: newStatus
      });
      
      if (response.data.success) {
        // Reload orders
        loadOrdersAndStats();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedEmployee]);

  const totalOrders = orders.completed + orders.inProgress + orders.notStarted;

  // Pie chart calculation
  const calculatePieChart = () => {
    const total = totalOrders;
    const completedAngle = (orders.completed / total) * 360;
    const progressAngle = (orders.inProgress / total) * 360;
    const notStartedAngle = (orders.notStarted / total) * 360;

    return { completedAngle, progressAngle, notStartedAngle, total };
  };

  const pieData = calculatePieChart();

  // Send message to employee
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedEmployee) return;

    const messageId = Date.now();
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const employeeIdKey = String(selectedEmployee.id);

    const newMessage = {
      id: messageId,
      text: currentMessage,
      sender: "me",
      timestamp: timestamp,
    };

    // Update UI immediately
    setMessages((prev) => ({
      ...prev,
      [employeeIdKey]: [...(prev[employeeIdKey] || []), newMessage],
    }));

    setCurrentMessage("");

    try {
      // Send message to backend
      await sendMessage({
        senderId: currentUserId,
        senderName: "John Doe",
        receiverId: selectedEmployee.id.toString(),
        receiverName: selectedEmployee.name,
        text: newMessage.text
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }

    // Simulate response after 1 second (remove this in real app with WebSocket)
    setTimeout(() => {
      const response = {
        id: Date.now(),
        text: "Thanks for your message. I'll get back to you soon!",
        sender: "them",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => ({
        ...prev,
        [employeeIdKey]: [...(prev[employeeIdKey] || []), response],
      }));
    }, 1000);
  };

  // Send message to chatbot
  const sendChatbotMessage = () => {
    if (!chatbotInput.trim()) return;

    const userMessage = {
      type: "user",
      text: chatbotInput,
    };

    setChatbotMessages((prev) => [...prev, userMessage]);
    setChatbotInput("");

    // Simulate bot response
    setTimeout(() => {
      const responses = [
        "I understand. Let me help you with that.",
        "That's a great question! Here's what I can tell you...",
        "I'm processing your request. Please give me a moment.",
        "Based on your query, I recommend checking the assigned orders section.",
        "Would you like me to explain more about this topic?",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const botMessage = {
        type: "bot",
        text: randomResponse,
      };
      setChatbotMessages((prev) => [...prev, botMessage]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employee View</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your work and communicate with team</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">John Doe</p>
              <p className="text-xs text-gray-500">EMP-12345</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              JD
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "dashboard"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("assigned")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "assigned"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Assigned Orders
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "chat"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div>
            <div className="grid grid-cols-3 gap-6 mb-6">
              {/* Pie Chart */}
              <div className="col-span-2 bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Order Status Overview</h2>
                <div className="flex items-center justify-center py-8">
                  <div className="relative">
                    <svg width="280" height="280" viewBox="0 0 280 280">
                      <circle cx="140" cy="140" r="100" fill="none" />
                      
                      {/* Completed slice */}
                      <circle
                        cx="140"
                        cy="140"
                        r="100"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="80"
                        strokeDasharray={`${(pieData.completedAngle / 360) * 628} 628`}
                        transform="rotate(-90 140 140)"
                      />
                      
                      {/* In Progress slice */}
                      <circle
                        cx="140"
                        cy="140"
                        r="100"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="80"
                        strokeDasharray={`${(pieData.progressAngle / 360) * 628} 628`}
                        strokeDashoffset={`-${(pieData.completedAngle / 360) * 628}`}
                        transform="rotate(-90 140 140)"
                      />
                      
                      {/* Not Started slice */}
                      <circle
                        cx="140"
                        cy="140"
                        r="100"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="80"
                        strokeDasharray={`${(pieData.notStartedAngle / 360) * 628} 628`}
                        strokeDashoffset={`-${((pieData.completedAngle + pieData.progressAngle) / 360) * 628}`}
                        transform="rotate(-90 140 140)"
                      />
                      
                      {/* Center circle */}
                      <circle cx="140" cy="140" r="60" fill="white" />
                      <text x="140" y="135" textAnchor="middle" className="text-3xl font-bold fill-gray-800">
                        {totalOrders}
                      </text>
                      <text x="140" y="155" textAnchor="middle" className="text-sm fill-gray-600">
                        Total Orders
                      </text>
                    </svg>
                  </div>
                  
                  {/* Legend */}
                  <div className="ml-12 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Completed</p>
                        <p className="text-lg font-bold text-gray-900">{orders.completed}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-amber-500 rounded"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">In Progress</p>
                        <p className="text-lg font-bold text-gray-900">{orders.inProgress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Not Started</p>
                        <p className="text-lg font-bold text-gray-900">{orders.notStarted}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chatbot */}
              <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Assistant</h2>
                <div className="flex-1 overflow-y-auto mb-4 space-y-3" style={{ maxHeight: "350px" }}>
                  {chatbotMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatbotInput}
                    onChange={(e) => setChatbotInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendChatbotMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendChatbotMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
                <p className="text-sm text-gray-600 mb-1">Assigned</p>
                <p className="text-3xl font-bold text-gray-900">{orders.notStarted}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
                <p className="text-sm text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{orders.inProgress}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{orders.completed}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Orders Tab */}
        {activeTab === "assigned" && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: "calc(100vh - 240px)" }}>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">My Assigned Orders</h2>
              <p className="text-sm text-gray-600 mt-1">View and manage your assigned work orders</p>
            </div>
            <div className="p-6 overflow-y-auto" style={{ height: "calc(100% - 73px)" }}>
              <div className="space-y-4">
                {assignedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{order.orderNo}</h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.priority === "high"
                                ? "bg-red-100 text-red-700"
                                : order.priority === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {order.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{order.itemName}</p>
                        <p className="text-xs text-gray-500">Customer: {order.customer}</p>
                      </div>
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            order.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : order.status === "in-progress"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status === "in-progress"
                            ? "In Progress"
                            : order.status === "not-started"
                            ? "Not Started"
                            : "Completed"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Assigned Date</p>
                        <p className="font-medium text-gray-900">{order.assignedDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Due Date</p>
                        <p className="font-medium text-gray-900">{order.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Completion</p>
                        <p className="font-medium text-gray-900">{order.completionPercent}%</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            order.completionPercent === 100
                              ? "bg-green-500"
                              : order.completionPercent > 0
                              ? "bg-amber-500"
                              : "bg-gray-400"
                          }`}
                          style={{ width: `${order.completionPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                        View Details
                      </button>
                      {order.status !== "completed" && (
                        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                          Update Progress
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-lg shadow-sm" style={{ height: "calc(100vh - 240px)" }}>
            <div className="flex h-full">
              {/* Employee List */}
              <div className="w-80 border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Team Members</h2>
                  <p className="text-xs text-gray-600 mt-1">Click to start a conversation</p>
                </div>
                <div className="overflow-y-auto" style={{ height: "calc(100% - 73px)" }}>
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedEmployee?.id === employee.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {employee.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              employee.status === "online" ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{employee.name}</p>
                          <p className="text-xs text-gray-500">{employee.role}</p>
                          <p className="text-xs text-gray-400">ID: EMP-{employee.id.toString().padStart(3, "0")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedEmployee ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedEmployee.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{selectedEmployee.name}</p>
                          <p className="text-xs text-gray-500">{selectedEmployee.role}</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: "calc(100% - 145px)" }}>
                      {messages[String(selectedEmployee.id)]?.length > 0 ? (
                        messages[String(selectedEmployee.id)].map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                msg.sender === "me"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <p className="text-sm">{msg.text}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  msg.sender === "me" ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {msg.timestamp}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-500">
                            <p className="text-lg mb-2">No messages yet</p>
                            <p className="text-sm">Start a conversation with {selectedEmployee.name}</p>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">💬</span>
                      </div>
                      <p className="text-lg font-medium mb-2">Select a team member</p>
                      <p className="text-sm">Choose someone from the list to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import Time "mo:core/Time";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Nat16 "mo:core/Nat16";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    role : Text; // "admin" or "cashier"
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Enumerations
  module Category {
    public type Type = {
      #espresso;
      #latte;
      #coldBrew;
      #pastries;
    };

    public func compare(a : Type, b : Type) : Order.Order {
      switch (a, b) {
        case (#espresso, #espresso) { #equal };
        case (#espresso, _) { #less };
        case (#latte, #espresso) { #greater };
        case (#latte, #latte) { #equal };
        case (#latte, _) { #less };
        case (#coldBrew, #pastries) { #less };
        case (#coldBrew, #coldBrew) { #equal };
        case (_) { #greater };
      };
    };
  };

  module Status {
    public type Type = {
      #pending;
      #processing;
      #paid;
      #cancelled;
    };

    public func compare(a : Type, b : Type) : Order.Order {
      switch (a, b) {
        case (#pending, #pending) { #equal };
        case (#pending, _) { #less };
        case (#processing, #pending) { #greater };
        case (#processing, #processing) { #equal };
        case (#processing, _) { #less };
        case (#paid, #cancelled) { #less };
        case (#paid, #paid) { #equal };
        case (_) { #greater };
      };
    };
  };

  // Types
  public type MenuItem = {
    name : Text;
    category : Category.Type;
    price : Nat;
    description : Text;
    available : Bool;
  };
  module MenuItem {
    public func compare(item1 : MenuItem, item2 : MenuItem) : Order.Order {
      Text.compare(item1.name, item2.name);
    };
  };

  public type ItemQuantity = {
    itemId : Nat;
    quantity : Nat;
  };

  public type OrderType = {
    timestamp : Int;
    orderId : Nat;
    customerName : Text;
    tableNumber : Nat;
    items : [ItemQuantity];
    status : Status.Type;
    discount : Nat;
    total : Nat;
  };
  module OrderModule {
    public func compare(a : OrderType, b : OrderType) : Order.Order {
      Nat.compare(a.orderId, b.orderId);
    };
  };

  public type BillSummary = {
    orderId : Nat;
    items : [ItemQuantity];
    subtotal : Nat;
    discount : Nat;
    total : Nat;
  };

  public type SalesReport = {
    dailyRevenue : Nat;
    orderCount : Nat;
    averageOrderValue : Nat;
    topSellingItems : [(Nat, Nat)]; // (itemId, quantity sold)
  };

  // Storage
  let menu = Map.empty<Nat, MenuItem>();
  let orders = Map.empty<Nat, OrderType>();
  var nextMenuItemId = 1;
  var nextOrderId = 1;

  // Seed Data
  func seedMenu() {
    let espresso = {
      name = "Espresso";
      category = #espresso;
      price = 300;
      description = "Strong black coffee";
      available = true;
    };
    menu.add(nextMenuItemId, espresso);
    nextMenuItemId += 1;

    let latte = {
      name = "Latte";
      category = #latte;
      price = 400;
      description = "Coffee with steamed milk";
      available = true;
    };
    menu.add(nextMenuItemId, latte);
    nextMenuItemId += 1;

    let coldBrew = {
      name = "Cold Brew";
      category = #coldBrew;
      price = 350;
      description = "Cold brewed coffee";
      available = true;
    };
    menu.add(nextMenuItemId, coldBrew);
    nextMenuItemId += 1;

    let croissant = {
      name = "Croissant";
      category = #pastries;
      price = 250;
      description = "Buttery French pastry";
      available = true;
    };
    menu.add(nextMenuItemId, croissant);
    nextMenuItemId += 1;
  };

  // Menu Management (Admin only)
  public shared ({ caller }) func addMenuItem(item : MenuItem) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add menu items");
    };

    let id = nextMenuItemId;
    menu.add(id, item);
    nextMenuItemId += 1;
    id;
  };

  public shared ({ caller }) func updateMenuItem(id : Nat, item : MenuItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update menu items");
    };

    switch (menu.get(id)) {
      case (?_) {
        menu.add(id, item);
      };
      case (null) {
        Runtime.trap("Menu item not found");
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete menu items");
    };

    menu.remove(id);
  };

  // Any authenticated user can initialize menu (idempotent - only seeds if empty)
  public shared func initializeMenuIfEmpty() : async () {
    if (menu.size() == 0) {
      seedMenu();
    };
  };

  // Public menu access (no authentication required - guests can view)
  public query func getMenu() : async [MenuItem] {
    menu.values().toArray().sort();
  };

  // Returns menu entries as (id, item) tuples so frontend can reference item IDs
  public query func getMenuEntries() : async [(Nat, MenuItem)] {
    menu.entries().toArray().sort(func(a : (Nat, MenuItem), b : (Nat, MenuItem)) : Order.Order {
      Nat.compare(a.0, b.0)
    });
  };

  public query func getMenuItem(id : Nat) : async ?MenuItem {
    menu.get(id);
  };

  // Order Management (Cashier/User only)
  public shared ({ caller }) func createOrder(name : Text, tableNumber : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only cashiers can create orders");
    };

    let orderId = nextOrderId;
    let order : OrderType = {
      timestamp = Time.now();
      orderId;
      customerName = name;
      tableNumber;
      items = [];
      status = #pending;
      discount = 0;
      total = 0;
    };

    orders.add(orderId, order);
    nextOrderId += 1;
    orderId;
  };

  public shared ({ caller }) func addItemToOrder(orderId : Nat, itemId : Nat, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only cashiers can add items to orders");
    };

    switch (orders.get(orderId)) {
      case (?order) {
        // Verify menu item exists
        switch (menu.get(itemId)) {
          case (?_) {
            let updatedItems = order.items.concat([{ itemId; quantity }]);
            let newTotal = calculateOrderTotal(updatedItems, order.discount);
            let updatedOrder : OrderType = {
              order with items = updatedItems;
              total = newTotal;
            };
            orders.add(orderId, updatedOrder);
          };
          case (null) {
            Runtime.trap("Menu item not found");
          };
        };
      };
      case (null) {
        Runtime.trap("Order not found");
      };
    };
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, status : Status.Type) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only cashiers can update order status");
    };

    switch (orders.get(orderId)) {
      case (?order) {
        let updatedOrder : OrderType = {
          order with status
        };
        orders.add(orderId, updatedOrder);
      };
      case (null) {
        Runtime.trap("Order not found");
      };
    };
  };

  public shared ({ caller }) func applyDiscount(orderId : Nat, discountPercent : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only cashiers can apply discounts");
    };

    if (discountPercent > 100) {
      Runtime.trap("Discount percentage cannot exceed 100");
    };

    switch (orders.get(orderId)) {
      case (?order) {
        let newTotal = calculateOrderTotal(order.items, discountPercent);
        let updatedOrder : OrderType = {
          order with discount = discountPercent;
          total = newTotal;
        };
        orders.add(orderId, updatedOrder);
      };
      case (null) {
        Runtime.trap("Order not found");
      };
    };
  };

  public query ({ caller }) func getOrder(orderId : Nat) : async ?OrderType {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only cashiers can view orders");
    };
    orders.get(orderId);
  };

  public query ({ caller }) func getAllOrders() : async [OrderType] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only cashiers can view orders");
    };
    orders.values().toArray().sort();
  };

  // Billing
  public query ({ caller }) func getBillSummary(orderId : Nat) : async ?BillSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only cashiers can view bills");
    };

    switch (orders.get(orderId)) {
      case (?order) {
        let subtotal = calculateSubtotal(order.items);
        ?{
          orderId = order.orderId;
          items = order.items;
          subtotal;
          discount = order.discount;
          total = order.total;
        };
      };
      case (null) { null };
    };
  };

  // Sales Reporting (Admin and Cashier)
  public query ({ caller }) func getSalesReport(startTime : Int, endTime : Int) : async SalesReport {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only cashiers and admins can view sales reports");
    };

    var totalRevenue : Nat = 0;
    var orderCount : Nat = 0;
    let itemSales = Map.empty<Nat, Nat>();

    for ((_, order) in orders.entries()) {
      if (order.timestamp >= startTime and order.timestamp <= endTime and order.status == #paid) {
        totalRevenue += order.total;
        orderCount += 1;

        for (item in order.items.vals()) {
          let currentQty = switch (itemSales.get(item.itemId)) {
            case (?qty) { qty };
            case (null) { 0 };
          };
          itemSales.add(item.itemId, currentQty + item.quantity);
        };
      };
    };

    let avgOrderValue = if (orderCount > 0) {
      totalRevenue / orderCount;
    } else {
      0;
    };

    let topItems = itemSales.entries().toArray().sort(func(a : (Nat, Nat), b : (Nat, Nat)) : Order.Order {
      Nat.compare(b.1, a.1); // Sort descending by quantity
    });

    {
      dailyRevenue = totalRevenue;
      orderCount;
      averageOrderValue = avgOrderValue;
      topSellingItems = topItems;
    };
  };

  // Helper functions
  func calculateSubtotal(items : [ItemQuantity]) : Nat {
    var subtotal : Nat = 0;
    for (item in items.vals()) {
      switch (menu.get(item.itemId)) {
        case (?menuItem) {
          subtotal += menuItem.price * item.quantity;
        };
        case (null) {};
      };
    };
    subtotal;
  };

  func calculateOrderTotal(items : [ItemQuantity], discountPercent : Nat) : Nat {
    let subtotal = calculateSubtotal(items);
    let discountAmount = (subtotal * discountPercent) / 100;
    if (subtotal >= discountAmount) {
      subtotal - discountAmount;
    } else {
      0;
    };
  };
};

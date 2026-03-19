import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiCategory {
  const ApiCategory({required this.id, required this.name});

  final int id;
  final String name;

  factory ApiCategory.fromJson(Map<String, dynamic> json) {
    return ApiCategory(
      id: (json['id'] as num).toInt(),
      name: (json['name'] as String?) ?? '',
    );
  }
}

class ApiProduct {
  const ApiProduct({
    required this.id,
    required this.name,
    required this.price,
    required this.imagePath,
    required this.categoryId,
  });

  final int id;
  final String name;
  final double price;
  final String? imagePath;
  final int? categoryId;

  factory ApiProduct.fromJson(Map<String, dynamic> json) {
    return ApiProduct(
      id: (json['id'] as num).toInt(),
      name: (json['name'] as String?) ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      imagePath: json['image_path'] as String?,
      categoryId: (json['category_id'] as num?)?.toInt(),
    );
  }
}

class ApiOrderTable {
  const ApiOrderTable({
    required this.id,
    required this.tableNumber,
    required this.tableColor,
  });

  final int id;
  final int tableNumber;
  final String tableColor;

  factory ApiOrderTable.fromJson(Map<String, dynamic> json) {
    return ApiOrderTable(
      id: (json['id'] as num).toInt(),
      tableNumber: (json['table_number'] as num?)?.toInt() ?? 0,
      tableColor: (json['table_color'] as String?) ?? '#FFE5B4',
    );
  }
}

class ApiMe {
  const ApiMe({required this.id, required this.username});

  final int id;
  final String username;

  factory ApiMe.fromJson(Map<String, dynamic> json) {
    return ApiMe(
      id: (json['id'] as num).toInt(),
      username: (json['username'] as String?) ?? '',
    );
  }
}

class ApiOrderRow {
  const ApiOrderRow({
    required this.id,
    required this.totalPrice,
    required this.waitressWage,
    required this.discountAmount,
    required this.createdAt,
  });

  final int id;
  final double totalPrice;
  final double waitressWage;
  final double discountAmount;
  final String createdAt;

  double get discountedTotal {
    final discounted = totalPrice - discountAmount;
    return discounted < 0 ? 0 : discounted;
  }

  double get finalTotal => discountedTotal + waitressWage;

  factory ApiOrderRow.fromJson(Map<String, dynamic> json) {
    final total = (json['total_price'] as num?)?.toDouble() ?? 0;
    final discount = (json['discount_amount'] as num?)?.toDouble() ?? 0;
    final waitressWage = (json['waitress_wage'] as num?)?.toDouble() ?? 0;

    return ApiOrderRow(
      id: (json['id'] as num).toInt(),
      totalPrice: total,
      waitressWage: waitressWage,
      discountAmount: discount,
      createdAt: (json['created_at'] as String?) ?? '',
    );
  }
}

class ApiOrderHistoryOverview {
  const ApiOrderHistoryOverview({
    required this.totalOrders,
    required this.totalSum,
    required this.totalNetSum,
    required this.totalDiscountSum,
  });

  final int totalOrders;
  final double totalSum;
  final double totalNetSum;
  final double totalDiscountSum;

  factory ApiOrderHistoryOverview.fromJson(Map<String, dynamic> json) {
    return ApiOrderHistoryOverview(
      totalOrders: (json['total_orders'] as num?)?.toInt() ?? 0,
      totalSum: (json['total_sum'] as num?)?.toDouble() ?? 0,
      totalNetSum: (json['total_net_sum'] as num?)?.toDouble() ?? 0,
      totalDiscountSum: (json['total_discount_sum'] as num?)?.toDouble() ?? 0,
    );
  }
}

class ApiPage<T> {
  const ApiPage({
    required this.items,
    required this.total,
    required this.page,
    required this.size,
    required this.pages,
  });

  final List<T> items;
  final int total;
  final int page;
  final int size;
  final int pages;
}

class ApiOrderHistoryResponse {
  const ApiOrderHistoryResponse({required this.overview, required this.page});

  final ApiOrderHistoryOverview overview;
  final ApiPage<ApiOrderRow> page;

  static ApiOrderHistoryResponse? tryFromJson(dynamic raw) {
    if (raw is! Map) return null;
    final json = Map<String, dynamic>.from(raw);

    final overviewRaw = json['overview'];
    final pageRaw = json['page'];
    if (overviewRaw is! Map || pageRaw is! Map) return null;

    final pageJson = Map<String, dynamic>.from(pageRaw);
    final itemsRaw = pageJson['items'];
    if (itemsRaw is! List) return null;

    final items = itemsRaw
        .whereType<Map>()
        .map((item) => ApiOrderRow.fromJson(Map<String, dynamic>.from(item)))
        .toList();

    final page = ApiPage<ApiOrderRow>(
      items: items,
      total: (pageJson['total'] as num?)?.toInt() ?? items.length,
      page: (pageJson['page'] as num?)?.toInt() ?? 1,
      size: (pageJson['size'] as num?)?.toInt() ?? items.length,
      pages: (pageJson['pages'] as num?)?.toInt() ?? 1,
    );

    return ApiOrderHistoryResponse(
      overview: ApiOrderHistoryOverview.fromJson(Map<String, dynamic>.from(overviewRaw)),
      page: page,
    );
  }
}

class PosApi {
  PosApi({required String baseUrl, http.Client? client})
      : _baseUrl = baseUrl.trim().replaceAll(RegExp(r'/+$'), ''),
        _client = client ?? http.Client();

  final String _baseUrl;
  final http.Client _client;

  Future<List<ApiCategory>> fetchCategories() async {
    final res = await _client.get(Uri.parse('$_baseUrl/product-categories'));
    if (res.statusCode < 200 || res.statusCode >= 300) return const [];

    final raw = jsonDecode(res.body);
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((item) => ApiCategory.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<List<ApiProduct>> fetchProducts({int? categoryId}) async {
    Uri url;
    if (categoryId == null) {
      url = Uri.parse('$_baseUrl/products');
    } else {
      url = Uri.parse('$_baseUrl/products').replace(queryParameters: {'category_id': '$categoryId'});
    }

    final res = await _client.get(url);
    if (res.statusCode < 200 || res.statusCode >= 300) return const [];

    final raw = jsonDecode(res.body);
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((item) => ApiProduct.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<List<ApiOrderTable>> fetchOrderTables() async {
    final res = await _client.get(Uri.parse('$_baseUrl/orders/tables'));
    if (res.statusCode < 200 || res.statusCode >= 300) return const [];

    final raw = jsonDecode(res.body);
    if (raw is! List) return const [];
    return raw
        .whereType<Map>()
        .map((item) => ApiOrderTable.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<ApiMe?> fetchMe({required String accessToken}) async {
    final res = await _client.get(
      Uri.parse('$_baseUrl/users/me'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    if (res.statusCode < 200 || res.statusCode >= 300) return null;
    final raw = jsonDecode(res.body);
    if (raw is! Map) return null;
    return ApiMe.fromJson(Map<String, dynamic>.from(raw));
  }

  Future<bool> createOrder({
    required int total,
    required int discountedTotal,
    required int userId,
    required int orderTableId,
    required List<Map<String, dynamic>> items,
  }) async {
    final payload = {
      'total': total,
      'discounted_total': discountedTotal,
      'user_id': userId,
      'order_table_id': orderTableId,
      'items': items,
    };

    final res = await _client.post(
      Uri.parse('$_baseUrl/orders'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return res.statusCode >= 200 && res.statusCode < 300;
  }

  Future<ApiOrderHistoryResponse?> fetchMyOrderHistory({
    required String accessToken,
    required int page,
    required int size,
  }) async {
    final url = Uri.parse('$_baseUrl/orders/my-history').replace(
      queryParameters: {'page': '$page', 'size': '$size'},
    );

    final res = await _client.get(
      url,
      headers: {'Authorization': 'Bearer $accessToken'},
    );
    if (res.statusCode == 401 || res.statusCode == 403) return null;
    if (res.statusCode < 200 || res.statusCode >= 300) return null;
    final raw = jsonDecode(res.body);
    return ApiOrderHistoryResponse.tryFromJson(raw);
  }
}

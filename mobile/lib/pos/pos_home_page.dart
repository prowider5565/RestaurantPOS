import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:convert';

import '../api/api_config.dart';
import '../api/pos_api.dart';
import '../auth/login_page.dart';
import '../auth/token_store.dart';
import '../shared/backend_endpoint_store.dart';

class UiProduct {
  const UiProduct({
    required this.id,
    required this.name,
    required this.price,
    required this.imageUrl,
    required this.categoryId,
  });

  final int id;
  final String name;
  final double price;
  final String imageUrl;
  final int? categoryId;
}

class CartLine {
  const CartLine({required this.product, required this.qty});

  final UiProduct product;
  final int qty;
}

class PosHomePage extends StatefulWidget {
  const PosHomePage({super.key});

  @override
  State<PosHomePage> createState() => _PosHomePageState();
}

class _PosHomePageState extends State<PosHomePage> {
  final _tokenStore = TokenStore();
  final _endpointStore = BackendEndpointStore();

  late PosApi _api;
  String _baseUrl = ApiConfig.defaultBaseUrl;

  int _tabIndex = 0;
  bool _useSlide = false;
  bool _slideFromRight = true;

  String _search = '';
  int? _selectedCategoryId;

  bool _isLoading = false;
  bool _isPlacingOrder = false;
  int? _currentUserId;

  List<ApiCategory> _apiCategories = const [];
  List<UiProduct> _products = const [];
  List<ApiOrderTable> _orderTables = const [];
  int? _selectedOrderTableId;

  final Map<int, CartLine> _cart = {};

  bool _statsLoading = false;
  String _statsError = '';
  int _statsPage = 1;
  final int _statsSize = 12;
  int _statsPages = 1;
  ApiOrderHistoryOverview? _statsOverview;
  List<ApiOrderRow> _statsRows = const [];

  final _hostController = TextEditingController();
  final _portController = TextEditingController();
  String _settingsError = '';

  bool _isEditingDiscount = false;
  int? _discountedTotalOverride;
  final _discountController = TextEditingController();
  final _discountFocusNode = FocusNode();

  final _moneyFormat = NumberFormat.decimalPattern('uz_UZ');

  @override
  void initState() {
    super.initState();
    _api = PosApi(baseUrl: _baseUrl);
    _bootstrap();
  }

  @override
  void dispose() {
    _hostController.dispose();
    _portController.dispose();
    _discountController.dispose();
    _discountFocusNode.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() => _isLoading = true);
    try {
      final endpoint = await _endpointStore.read();
      if (endpoint != null) {
        _baseUrl = 'http://${endpoint.host}:${endpoint.port}';
      } else {
        _baseUrl = ApiConfig.defaultBaseUrl;
      }
      _api = PosApi(baseUrl: _baseUrl);

      final parsed = Uri.tryParse(_baseUrl);
      _hostController.text = endpoint?.host ?? (parsed?.host ?? '');
      _portController.text = endpoint?.port.toString() ?? ((parsed?.hasPort ?? false) ? '${parsed?.port}' : '');

      final token = await _tokenStore.readAccessToken();
      if (token != null && token.trim().isNotEmpty) {
        _currentUserId = _tryParseUserIdFromJwt(token.trim());
        final me = await _api.fetchMe(accessToken: token.trim());
        if (me != null) _currentUserId = me.id;
      }

      final categories = await _api.fetchCategories();
      final products = await _api.fetchProducts(categoryId: _selectedCategoryId);
      final orderTables = await _api.fetchOrderTables();
      if (!mounted) return;
      setState(() {
        _apiCategories = categories;
        _products = products.map(_toUiProduct).toList();
        _orderTables = orderTables;
        if (orderTables.isEmpty) {
          _selectedOrderTableId = null;
        } else if (_selectedOrderTableId == null || !orderTables.any((t) => t.id == _selectedOrderTableId)) {
          _selectedOrderTableId = orderTables.first.id;
        }
      });
    } finally {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  String _formatMoneyInt(int value) {
    return '${_moneyFormat.format(value)} so\'m';
  }

  int? _tryParseUserIdFromJwt(String token) {
    try {
      final parts = token.split('.');
      if (parts.length < 2) return null;
      final payload = parts[1];
      final normalized = base64Url.normalize(payload);
      final decoded = utf8.decode(base64Url.decode(normalized));
      final json = jsonDecode(decoded);
      if (json is! Map) return null;
      final sub = json['sub'];
      if (sub is String) return int.tryParse(sub);
      if (sub is num) return sub.toInt();
      return null;
    } catch (_) {
      return null;
    }
  }

  String _productImageUrl(ApiProduct p) {
    final raw = p.imagePath?.trim();
    if (raw == null || raw.isEmpty) return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

    final normalized = raw.replaceAll('\\', '/');
    final parts = normalized.split('/').where((s) => s.isNotEmpty).toList();
    if (parts.isEmpty) return '';
    final filename = parts.last;
    return '$_baseUrl/media/products/$filename';
  }

  UiProduct _toUiProduct(ApiProduct p) {
    return UiProduct(
      id: p.id,
      name: p.name,
      price: p.price,
      imageUrl: _productImageUrl(p),
      categoryId: p.categoryId,
    );
  }

  List<UiProduct> get _visibleProducts {
    final q = _search.trim().toLowerCase();
    if (q.isEmpty) return _products;
    return _products.where((p) => p.name.toLowerCase().contains(q)).toList();
  }

  int get _totalInt {
    var sum = 0.0;
    for (final line in _cart.values) {
      sum += line.qty * line.product.price;
    }
    return sum.round();
  }

  int get _cartItemCount {
    var count = 0;
    for (final line in _cart.values) {
      count += line.qty;
    }
    return count;
  }

  int get _discountedTotalInt {
    final total = _totalInt;
    final raw = _discountedTotalOverride ?? total;
    if (raw < 0) return 0;
    if (raw > total) return total;
    return raw;
  }

  void _setTab(int next) {
    if (next == _tabIndex) return;

    final prev = _tabIndex;
    final isMenuCartSwitch = (prev == 0 && next == 1) || (prev == 1 && next == 0);

    setState(() {
      _useSlide = isMenuCartSwitch;
      _slideFromRight = next == 1;
      _tabIndex = next;
      _stopEditingDiscount();
    });

    if (next == 2) {
      _loadMyStats(page: _statsPage);
    }
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    try {
      final products = await _api.fetchProducts(categoryId: _selectedCategoryId);
      if (!mounted) return;
      setState(() {
        _products = products.map(_toUiProduct).toList();
      });
    } finally {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadCategoriesAndProducts() async {
    setState(() => _isLoading = true);
    try {
      final categories = await _api.fetchCategories();
      final products = await _api.fetchProducts(categoryId: _selectedCategoryId);
      final orderTables = await _api.fetchOrderTables();
      if (!mounted) return;
      setState(() {
        _apiCategories = categories;
        _products = products.map(_toUiProduct).toList();
        _orderTables = orderTables;
        if (orderTables.isEmpty) {
          _selectedOrderTableId = null;
        } else if (_selectedOrderTableId == null || !orderTables.any((t) => t.id == _selectedOrderTableId)) {
          _selectedOrderTableId = orderTables.first.id;
        }
      });
    } finally {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  Future<void> _saveBackendEndpoint() async {
    final host = _hostController.text.trim();
    final port = int.tryParse(_portController.text.trim());

    if (host.isEmpty || port == null || port <= 0 || port > 65535) {
      setState(() => _settingsError = 'IP manzil va portni to‘g‘ri kiriting.');
      return;
    }

    setState(() => _settingsError = '');
    await _endpointStore.write(host: host, port: port);

    setState(() {
      _baseUrl = 'http://$host:$port';
      _api = PosApi(baseUrl: _baseUrl);
    });

    await _loadCategoriesAndProducts();
  }

  void _addToCart(UiProduct product) {
    setState(() {
      final existing = _cart[product.id];
      _cart[product.id] = CartLine(product: product, qty: (existing?.qty ?? 0) + 1);
    });
  }

  void _setQty(int productId, int qty) {
    setState(() {
      if (qty <= 0) {
        _cart.remove(productId);
        return;
      }
      final existing = _cart[productId];
      if (existing == null) return;
      _cart[productId] = CartLine(product: existing.product, qty: qty);
    });
  }

  void _clearCart() {
    setState(() {
      _cart.clear();
      _discountedTotalOverride = null;
      _stopEditingDiscount();
    });
  }

  void _startEditingDiscount() {
    if (_cart.isEmpty) return;
    setState(() {
      _isEditingDiscount = true;
      _discountController.text = _discountedTotalInt.toString();
    });
    _discountFocusNode.requestFocus();
  }

  void _stopEditingDiscount() {
    _isEditingDiscount = false;
    _discountFocusNode.unfocus();
  }

  void _applyDiscountInput() {
    final total = _totalInt;
    final raw = _discountController.text.replaceAll(RegExp(r'[^\d]'), '');
    final parsed = int.tryParse(raw) ?? 0;
    final clamped = parsed.clamp(0, total);
    setState(() {
      _discountedTotalOverride = clamped == total ? null : clamped;
      _stopEditingDiscount();
    });
  }

  Future<void> _placeOrder() async {
    if (_cart.isEmpty || _isPlacingOrder) return;
    if (_selectedOrderTableId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Buyurtma uchun stol tanlanishi shart.")),
      );
      return;
    }
    if (_currentUserId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Foydalanuvchi topilmadi (token yo'q). Avval tizimga kiring.")),
      );
      return;
    }

    setState(() => _isPlacingOrder = true);
    try {
      final ok = await _api.createOrder(
        total: _totalInt,
        discountedTotal: _discountedTotalInt,
        userId: _currentUserId!,
        orderTableId: _selectedOrderTableId!,
        items: _cart.values.map((line) => {'product': line.product.id, 'quantity': line.qty}).toList(),
      );

      if (!mounted) return;
      if (!ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Buyurtma yuborilmadi. Backend manzilini tekshiring.")),
        );
        return;
      }

      _clearCart();
      _setTab(0);
    } finally {
      if (!mounted) return;
      setState(() => _isPlacingOrder = false);
    }
  }

  String _formatCreated(String iso) {
    try {
      final dt = DateTime.tryParse(iso);
      if (dt == null) return iso;
      final yyyy = dt.year.toString().padLeft(4, '0');
      final mm = dt.month.toString().padLeft(2, '0');
      final dd = dt.day.toString().padLeft(2, '0');
      final hh = dt.hour.toString().padLeft(2, '0');
      final min = dt.minute.toString().padLeft(2, '0');
      return '$yyyy-$mm-$dd $hh:$min';
    } catch (_) {
      return iso;
    }
  }

  Future<void> _loadMyStats({required int page}) async {
    if (_statsLoading) return;

    setState(() {
      _statsLoading = true;
      _statsError = '';
    });

    try {
      final token = (await _tokenStore.readAccessToken())?.trim() ?? '';
      if (token.isEmpty) {
        if (!mounted) return;
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginPage()),
          (_) => false,
        );
        return;
      }

      final res = await _api.fetchMyOrderHistory(accessToken: token, page: page, size: _statsSize);
      if (!mounted) return;
      if (res == null) {
        setState(() => _statsError = 'Statistika yuklanmadi. Token yoki backendni tekshiring.');
        return;
      }

      setState(() {
        _statsPage = res.page.page;
        _statsPages = res.page.pages;
        _statsOverview = res.overview;
        _statsRows = res.page.items;
      });
    } finally {
      if (!mounted) return;
      setState(() => _statsLoading = false);
    }
  }

  PreferredSizeWidget? _buildAppBarBottom() {
    if (_tabIndex != 0) return null;

    return PreferredSize(
      preferredSize: const Size.fromHeight(64),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        child: TextField(
          decoration: InputDecoration(
            hintText: 'Mahsulot qidirish...',
            prefixIcon: const Icon(Icons.search),
            filled: true,
            fillColor: const Color(0xFFF7F7F7),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
          ),
          textInputAction: TextInputAction.search,
          onChanged: (v) => setState(() => _search = v),
        ),
      ),
    );
  }

  Widget _buildCategoriesRow() {
    final chips = <({String label, int? id})>[
      (label: 'Barchasi', id: null),
      (label: 'Kategoriyasiz', id: 0),
      ..._apiCategories.map((c) => (label: c.name, id: c.id)),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Row(
        children: [
          for (final chip in chips) ...[
            ChoiceChip(
              label: Text(chip.label),
              selected: _selectedCategoryId == chip.id,
              onSelected: (_) async {
                setState(() => _selectedCategoryId = chip.id);
                await _loadProducts();
              },
            ),
            const SizedBox(width: 10),
          ],
        ],
      ),
    );
  }

  Widget _buildProductCard(UiProduct p) {
    final isSelected = (_cart[p.id]?.qty ?? 0) > 0;
    return _AnimatedProductCard(
      product: p,
      priceText: _formatMoneyInt(p.price.round()),
      isSelected: isSelected,
      onTap: () => _addToCart(p),
    );
  }

  Widget _buildMenuTab() {
    return Column(
      children: [
        _buildCategoriesRow(),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _visibleProducts.isEmpty
                  ? const Center(child: Text("Hali mahsulot yo'q"))
                  : GridView.builder(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.1,
                      ),
                      itemCount: _visibleProducts.length,
                      itemBuilder: (context, index) => _buildProductCard(_visibleProducts[index]),
                    ),
        ),
      ],
    );
  }

  Widget _buildCartLine(CartLine line) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFFE8E8E8))),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(line.product.name, style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(_formatMoneyInt(line.product.price.round()), style: TextStyle(color: Colors.grey.shade700)),
                ],
              ),
            ),
            IconButton(
              onPressed: () => _setQty(line.product.id, line.qty - 1),
              icon: const Icon(Icons.remove_circle_outline),
              iconSize: 34,
              constraints: const BoxConstraints.tightFor(width: 56, height: 56),
            ),
            Text('${line.qty}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            IconButton(
              onPressed: () => _setQty(line.product.id, line.qty + 1),
              icon: const Icon(Icons.add_circle_outline),
              iconSize: 34,
              constraints: const BoxConstraints.tightFor(width: 56, height: 56),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDiscountBlock() {
    final total = _totalInt;
    final discounted = _discountedTotalInt;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Color(0xFFE8E8E8))),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Jami', style: TextStyle(fontWeight: FontWeight.w800)),
                Text(_formatMoneyInt(total), style: const TextStyle(fontWeight: FontWeight.w900)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Expanded(child: Text('Chegirmali summa', style: TextStyle(fontWeight: FontWeight.w800))),
                if (_isEditingDiscount)
                  SizedBox(
                    width: 150,
                    child: TextField(
                      controller: _discountController,
                      focusNode: _discountFocusNode,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _applyDiscountInput(),
                      decoration: const InputDecoration(isDense: true, border: OutlineInputBorder()),
                    ),
                  )
                else
                  InkWell(
                    onTap: _startEditingDiscount,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      child: Text(
                        _formatMoneyInt(discounted),
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                if (_isEditingDiscount)
                  IconButton(
                    onPressed: _applyDiscountInput,
                    icon: const Icon(Icons.check_circle_outline, color: Colors.green),
                  )
                else
                  IconButton(
                    onPressed: _startEditingDiscount,
                    icon: const Icon(Icons.edit_outlined),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartTab() {
    final lines = _cart.values.toList()..sort((a, b) => a.product.id.compareTo(b.product.id));
    ApiOrderTable? selectedTable;
    for (final table in _orderTables) {
      if (table.id == _selectedOrderTableId) {
        selectedTable = table;
        break;
      }
    }

    return GestureDetector(
      onTap: () {
        if (_isEditingDiscount) _applyDiscountInput();
      },
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Savat', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                IconButton(onPressed: _cart.isEmpty ? null : _clearCart, icon: const Icon(Icons.close)),
              ],
            ),
          ),
          Expanded(
            child: lines.isEmpty
                ? const Center(child: Text("Savat bo'sh"))
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                    itemCount: lines.length,
                    itemBuilder: (context, index) => _buildCartLine(lines[index]),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
            child: Card(
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: const BorderSide(color: Color(0xFFE8E8E8))),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: DropdownButtonFormField<int>(
                  value: _selectedOrderTableId,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    labelText: 'Stol tanlang',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: _orderTables
                      .map(
                        (table) => DropdownMenuItem<int>(
                          value: table.id,
                          child: Row(
                            children: [
                              Container(
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: Color(_parseHexColor(table.tableColor)),
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(color: const Color(0x22000000)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Stol ${table.tableNumber}',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.w700),
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: _orderTables.isEmpty
                      ? null
                      : (value) {
                          setState(() => _selectedOrderTableId = value);
                        },
                ),
              ),
            ),
          ),
          if (selectedTable == null)
            const Padding(
              padding: EdgeInsets.fromLTRB(12, 0, 12, 10),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Buyurtma uchun stol tanlanishi shart.",
                  style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700, fontSize: 12),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
            child: _buildDiscountBlock(),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
            child: Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: (_cart.isEmpty || _isPlacingOrder || _selectedOrderTableId == null) ? null : _placeOrder,
                    style: FilledButton.styleFrom(backgroundColor: Colors.green),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 14),
                      child: Text("Hozir to'lash", style: TextStyle(fontWeight: FontWeight.w900)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: (_cart.isEmpty || _isPlacingOrder) ? null : _clearCart,
                    style: FilledButton.styleFrom(backgroundColor: Colors.red),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 14),
                      child: Text('Bekor qilish', style: TextStyle(fontWeight: FontWeight.w900)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder(String title) {
    return Center(
      child: Text(
        '$title (tez kunda)',
        style: const TextStyle(fontWeight: FontWeight.w800),
      ),
    );
  }

  Widget _buildStatisticsTab() {
    final overview = _statsOverview ??
        const ApiOrderHistoryOverview(
          totalOrders: 0,
          totalSum: 0,
          totalNetSum: 0,
          totalDiscountSum: 0,
        );
    final totalWaitressWage = overview.totalSum * 0.1;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
          child: Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: Color(0xFFE8E8E8)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Daromad', style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(
                    _moneyFormat.format(totalWaitressWage.round()),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 36, color: Colors.deepOrange),
                  ),
                  const SizedBox(height: 4),
                  Text("ofitsiant xizmati, jami so'm", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade700)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Text('Jami buyurtmalar', style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 4),
                            Text(
                              _moneyFormat.format(overview.totalOrders),
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Text('Jami summa', style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 4),
                            Text(
                              _formatMoneyInt(overview.totalNetSum.round()),
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        if (_statsError.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Text(_statsError, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w700)),
          ),
        Expanded(
          child: _statsLoading && _statsRows.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                  itemCount: _statsRows.length,
                  itemBuilder: (context, index) {
                    final o = _statsRows[index];
                    return Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                        side: const BorderSide(color: Color(0xFFE8E8E8)),
                      ),
                      child: ListTile(
                        title: Text('#${o.id}', style: const TextStyle(fontWeight: FontWeight.w900)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_formatCreated(o.createdAt)),
                            const SizedBox(height: 2),
                            Text(
                              "Chegirma: ${_formatMoneyInt(o.discountAmount.round())} • Xizmat: ${_formatMoneyInt(o.waitressWage.round())}",
                              style: TextStyle(color: Colors.grey.shade700, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        trailing: Text(
                          _formatMoneyInt(o.finalTotal.round()),
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                      ),
                    );
                  },
                ),
        ),
        if (_statsPages > 1)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  onPressed: (_statsLoading || _statsPage <= 1) ? null : () => _loadMyStats(page: _statsPage - 1),
                  icon: const Icon(Icons.chevron_left),
                ),
                Text('$_statsPage / $_statsPages', style: const TextStyle(fontWeight: FontWeight.w800)),
                IconButton(
                  onPressed: (_statsLoading || _statsPage >= _statsPages) ? null : () => _loadMyStats(page: _statsPage + 1),
                  icon: const Icon(Icons.chevron_right),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildSettingsTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      children: [
        const Text('Backend manzili', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
        const SizedBox(height: 12),
        TextField(
          controller: _hostController,
          decoration: const InputDecoration(
            labelText: 'IP manzil',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.url,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _portController,
          decoration: const InputDecoration(
            labelText: 'Port',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.number,
        ),
        if (_settingsError.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(_settingsError, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w700)),
        ],
        const SizedBox(height: 14),
        FilledButton(
          onPressed: _isLoading ? null : _saveBackendEndpoint,
          child: const Padding(
            padding: EdgeInsets.symmetric(vertical: 14),
            child: Text('Saqlash', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ),
        const SizedBox(height: 12),
        Text('Joriy URL: $_baseUrl', style: TextStyle(color: Colors.grey.shade700)),
      ],
    );
  }

  Widget _buildBody() {
    final child = switch (_tabIndex) {
      0 => _buildMenuTab(),
      1 => _buildCartTab(),
      2 => _buildStatisticsTab(),
      _ => _buildSettingsTab(),
    };

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      transitionBuilder: (child, animation) {
        if (!_useSlide) return FadeTransition(opacity: animation, child: child);
        final begin = _slideFromRight ? const Offset(1, 0) : const Offset(-1, 0);
        return SlideTransition(position: Tween<Offset>(begin: begin, end: Offset.zero).animate(animation), child: child);
      },
      child: KeyedSubtree(key: ValueKey('tab_$_tabIndex'), child: child),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Parhez Plyus', style: TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          IconButton(
            onPressed: () async {
              await _tokenStore.deleteAccessToken();
              if (!context.mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginPage()),
                (_) => false,
              );
            },
            icon: const Icon(Icons.logout),
          ),
        ],
        bottom: _buildAppBarBottom(),
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _tabIndex,
        type: BottomNavigationBarType.fixed,
        onTap: _setTab,
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.menu_book_outlined), label: 'Menyu'),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible: _cartItemCount > 0,
              label: Text('$_cartItemCount'),
              backgroundColor: Colors.red,
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            label: 'Savat',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.bar_chart_outlined), label: 'Statistika'),
          const BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), label: 'Sozlamalar'),
        ],
      ),
    );
  }
}

int _parseHexColor(String value) {
  final hex = value.trim().replaceFirst('#', '');
  if (hex.length == 6) {
    return int.tryParse('FF$hex', radix: 16) ?? 0xFFFFE5B4;
  }
  if (hex.length == 8) {
    return int.tryParse(hex, radix: 16) ?? 0xFFFFE5B4;
  }
  return 0xFFFFE5B4;
}

class _AnimatedProductCard extends StatefulWidget {
  const _AnimatedProductCard({
    required this.product,
    required this.priceText,
    required this.isSelected,
    required this.onTap,
  });

  final UiProduct product;
  final String priceText;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  State<_AnimatedProductCard> createState() => _AnimatedProductCardState();
}

class _AnimatedProductCardState extends State<_AnimatedProductCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: _pressed ? 0.97 : 1,
      duration: const Duration(milliseconds: 90),
      curve: Curves.easeOut,
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: BorderSide(
            color: widget.isSelected ? Colors.deepOrange : const Color(0xFFE8E8E8),
            width: widget.isSelected ? 2 : 1,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: widget.onTap,
          onTapDown: (_) => setState(() => _pressed = true),
          onTapCancel: () => setState(() => _pressed = false),
          onTapUp: (_) => setState(() => _pressed = false),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (widget.product.imageUrl.isNotEmpty)
                Image.network(
                  widget.product.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const ColoredBox(color: Color(0xFFF2F2F2)),
                )
              else
                const ColoredBox(color: Color(0xFFF2F2F2)),
              const DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color.fromRGBO(0, 0, 0, 0.10), Color.fromRGBO(0, 0, 0, 0.55)],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      widget.product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        height: 1.05,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.priceText,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 26,
                        height: 1.05,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

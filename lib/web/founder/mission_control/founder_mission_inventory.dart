import 'dart:math';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:rank_crackers/data/india_states.dart';
import '../theme/founder_light_theme.dart';
import 'mission_inventory_summary.dart';

enum MissionPortfolioFilter { all, live, draft, passive, archived, attention }

enum JurisdictionFilter { all, central, state, ut }

enum SortOption { recentlyUpdated, alphabetical, yearNewest, yearOldest, status }

/// Pure, testable logic for Founder Mission Inventory filtering, sorting & jurisdiction safety.
class MissionInventoryLogic {
  const MissionInventoryLogic._();

  /// State/UT selector safety when switching jurisdiction level.
  static String? reconcileStateCodeForJurisdiction({
    required JurisdictionFilter newJurisdiction,
    required String? currentStateCode,
  }) {
    if (currentStateCode == null || currentStateCode.trim().isEmpty) return null;
    final code = currentStateCode.trim().toUpperCase();

    if (newJurisdiction == JurisdictionFilter.central) {
      return null; // Central clears State/UT code
    }
    if (newJurisdiction == JurisdictionFilter.state) {
      return IndiaStates.isStateCode(code) ? code : null;
    }
    if (newJurisdiction == JurisdictionFilter.ut) {
      return IndiaStates.isUnionTerritoryCode(code) ? code : null;
    }
    return code; // ALL retains valid code
  }

  /// Pure filter and sort implementation over reconciled records.
  static List<MissionInventoryRecord> filterAndSort({
    required List<MissionInventoryRecord> rows,
    required String searchQuery,
    required JurisdictionFilter jurisdiction,
    required String? selectedStateCode,
    required MissionPortfolioFilter statusFilter,
    required String categoryFilter,
    required SortOption sortBy,
  }) {
    return rows.where((row) {
      // 1. Search Query (Matches title, ID, year, category, stateCode, org)
      if (searchQuery.isNotEmpty) {
        final q = searchQuery.toLowerCase();
        final matchTitle = row.displayName.toLowerCase().contains(q);
        final matchId = row.id.toLowerCase().contains(q);
        final matchYear = row.year.toLowerCase().contains(q);
        final matchCategory = row.category.toLowerCase().contains(q);
        final matchState = (row.stateCode ?? '').toLowerCase().contains(q);
        final matchOrg = row.organization.toLowerCase().contains(q);
        if (!matchTitle &&
            !matchId &&
            !matchYear &&
            !matchCategory &&
            !matchState &&
            !matchOrg) {
          return false;
        }
      }

      // 2. Jurisdiction Filter
      if (jurisdiction == JurisdictionFilter.central) {
        if (!row.isCentral) return false;
      } else if (jurisdiction == JurisdictionFilter.state) {
        if (!row.isState) return false;
      } else if (jurisdiction == JurisdictionFilter.ut) {
        if (!row.isUt) return false;
      }

      // 3. Specific State/UT Code Selector (Strict governed stateCode match; zero title heuristics)
      if (selectedStateCode != null && selectedStateCode.isNotEmpty) {
        final code = selectedStateCode.toUpperCase();
        final rowCode = (row.stateCode ?? '').toUpperCase();
        if (rowCode != code) {
          return false; // Zero title/displayName heuristic matching
        }
      }

      // 4. Category Filter
      if (categoryFilter != 'ALL') {
        final cat = row.category.toLowerCase();
        if (categoryFilter == 'COMPETITIVE' && !cat.contains('comp')) {
          return false;
        }
        if (categoryFilter == 'QUALIFYING' && !cat.contains('qual')) {
          return false;
        }
        if (categoryFilter == 'OTHER' &&
            (cat.contains('comp') || cat.contains('qual'))) {
          return false;
        }
      }

      // 5. Status Filter
      if (statusFilter == MissionPortfolioFilter.live && !row.studentVisible) {
        return false;
      }
      if (statusFilter == MissionPortfolioFilter.draft &&
          row.kind != MissionPortfolioFilter.draft) {
        return false;
      }
      if (statusFilter == MissionPortfolioFilter.passive &&
          row.kind != MissionPortfolioFilter.passive) {
        return false;
      }
      if (statusFilter == MissionPortfolioFilter.archived &&
          row.kind != MissionPortfolioFilter.archived) {
        return false;
      }
      if (statusFilter == MissionPortfolioFilter.attention &&
          !row.needsAttention) {
        return false;
      }

      return true;
    }).toList()
      ..sort((a, b) {
        switch (sortBy) {
          case SortOption.recentlyUpdated:
            final timeA = a.latestUpdatedAt;
            final timeB = b.latestUpdatedAt;
            if (timeA != null && timeB != null) {
              final cmp = timeB.compareTo(timeA); // Newest first
              if (cmp != 0) return cmp;
            } else if (timeA != null) {
              return -1; // Dated rows come before undated
            } else if (timeB != null) {
              return 1;
            }
            return a.displayName
                .toLowerCase()
                .compareTo(b.displayName.toLowerCase());

          case SortOption.alphabetical:
            return a.displayName
                .toLowerCase()
                .compareTo(b.displayName.toLowerCase());

          case SortOption.yearNewest:
            return b.year.compareTo(a.year);

          case SortOption.yearOldest:
            return a.year.compareTo(b.year);

          case SortOption.status:
            if (a.studentVisible != b.studentVisible) {
              return a.studentVisible ? -1 : 1;
            }
            return a.rawStatus.compareTo(b.rawStatus);
        }
      });
  }
}

class FounderMissionInventory extends StatefulWidget {
  const FounderMissionInventory({
    super.key,
    this.onMissionSelected,
    this.initialJurisdiction = JurisdictionFilter.all,
    this.initialStateCode,
  });

  final ValueChanged<String>? onMissionSelected;
  final JurisdictionFilter initialJurisdiction;
  final String? initialStateCode;

  @override
  State<FounderMissionInventory> createState() =>
      _FounderMissionInventoryState();
}

class _FounderMissionInventoryState extends State<FounderMissionInventory> {
  String _searchQuery = '';
  late JurisdictionFilter _jurisdiction;
  String? _selectedStateCode;
  MissionPortfolioFilter _statusFilter = MissionPortfolioFilter.all;
  String _categoryFilter = 'ALL';
  SortOption _sortBy = SortOption.recentlyUpdated;

  int _currentPage = 1;
  int _pageSize = 24; // Default page size: 24 missions per page

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _jurisdiction = widget.initialJurisdiction;
    _selectedStateCode = widget.initialStateCode;
  }

  @override
  void didUpdateWidget(FounderMissionInventory oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialJurisdiction != oldWidget.initialJurisdiction ||
        widget.initialStateCode != oldWidget.initialStateCode) {
      setState(() {
        _jurisdiction = widget.initialJurisdiction;
        _selectedStateCode = widget.initialStateCode;
        _currentPage = 1;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _resetFilters() {
    setState(() {
      _searchQuery = '';
      _searchController.clear();
      _jurisdiction = JurisdictionFilter.all;
      _selectedStateCode = null;
      _statusFilter = MissionPortfolioFilter.all;
      _categoryFilter = 'ALL';
      _sortBy = SortOption.recentlyUpdated;
      _currentPage = 1;
    });
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
      stream:
          FirebaseFirestore.instance.collection('mission_realms').snapshots(),
      builder: (context, realmsSnapshot) {
            final error = realmsSnapshot.error;
            if (error != null) {
              return _InventoryErrorState(
                  message: 'Mission inventory unavailable: $error');
            }

            if (!realmsSnapshot.hasData) {
              return const _InventoryLoadingState();
            }

            final allRows = _reconcile(
              realmsSnapshot.data!.docs,
            );
            final inventorySummary = MissionInventorySummary.fromRealms(
              realmsSnapshot.data!.docs.map((doc) => doc.data()),
            );

            final filteredRows = MissionInventoryLogic.filterAndSort(
              rows: allRows,
              searchQuery: _searchQuery,
              jurisdiction: _jurisdiction,
              selectedStateCode: _selectedStateCode,
              statusFilter: _statusFilter,
              categoryFilter: _categoryFilter,
              sortBy: _sortBy,
            );

            // Pagination calculation
            final totalFiltered = filteredRows.length;
            final totalPages = max(1, (totalFiltered / _pageSize).ceil());
            final safePage = min(_currentPage, totalPages);
            final startIndex = (safePage - 1) * _pageSize;
            final endIndex = min(startIndex + _pageSize, totalFiltered);
            final pageRows = (startIndex < totalFiltered)
                ? filteredRows.sublist(startIndex, endIndex)
                : <MissionInventoryRecord>[];

            return LayoutBuilder(builder: (context, constraints) {
              final double width = constraints.maxWidth;
              final int columns = width >= 1200
                  ? 3
                  : width >= 800
                      ? 2
                      : 1;
              final double availableWidth = width - 48 - ((columns - 1) * 16);
              final double cardWidth = availableWidth / columns;

              return Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Summary Metrics Cards Bar
                    _buildSummaryMetricsBar(allRows, inventorySummary),
                    const SizedBox(height: 20),

                    // Filter Control Panel Card
                    _buildFilterToolbarCard(),
                    const SizedBox(height: 16),

                    // Results Count & Active Filter Tags Bar
                    _buildResultsAndTagsBar(totalFiltered, safePage, totalPages,
                        startIndex, endIndex),
                    const SizedBox(height: 16),

                    // Mission Grid / Empty State
                    if (pageRows.isEmpty)
                      _buildEmptyState()
                    else
                      Wrap(
                        spacing: 16,
                        runSpacing: 16,
                        children: pageRows
                            .map((row) => SizedBox(
                                  width: cardWidth,
                                  child: _MissionPortfolioCard(
                                    row: row,
                                    onSelected: widget.onMissionSelected,
                                  ),
                                ))
                            .toList(),
                      ),

                    const SizedBox(height: 24),

                    // Pagination Footer
                    if (totalFiltered > 0)
                      _buildPaginationBar(safePage, totalPages, totalFiltered),
                  ],
                ),
              );
            });
          },
    );
    );
  }

  // ===========================================================================
  // SUMMARY METRICS BAR
  // ===========================================================================
  Widget _buildSummaryMetricsBar(
    List<MissionInventoryRecord> rows,
    MissionInventorySummary inventorySummary,
  ) {
    final int total = inventorySummary.total;
    final int live = rows.where((r) => r.kind == MissionPortfolioFilter.live).length;
    final int draft = rows.where((r) => r.kind == MissionPortfolioFilter.draft).length;
    final int passive = rows.where((r) => r.kind == MissionPortfolioFilter.passive).length;
    final int attention = rows.where((r) => r.needsAttention).length;

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _MetricCard('TOTAL MISSIONS', '$total', FounderLightTheme.primaryDark,
            Icons.grid_view_rounded),
        _MetricCard('LIVE FOR STUDENTS', '$live', FounderLightTheme.success,
            Icons.check_circle_rounded),
        _MetricCard('FOUNDER DRAFTS', '$draft', FounderLightTheme.primaryBlue,
            Icons.edit_note_rounded),
        _MetricCard('PASSIVE / STAGED', '$passive', FounderLightTheme.warning,
            Icons.hourglass_empty_rounded),
        _MetricCard('NEEDS ATTENTION', '$attention', FounderLightTheme.danger,
            Icons.warning_amber_rounded),
      ],
    );
  }

  // ===========================================================================
  // FILTER TOOLBAR CARD
  // ===========================================================================
  Widget _buildFilterToolbarCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FounderLightTheme.border),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row 1: Search Bar
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val.trim();
                      _currentPage = 1;
                    });
                  },
                  style: const TextStyle(
                    color: FounderLightTheme.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: InputDecoration(
                    hintText:
                        'Search missions by title, organization, year, state code, or ID...',
                    hintStyle: const TextStyle(
                      color: FounderLightTheme.textMuted,
                      fontSize: 12,
                    ),
                    prefixIcon: const Icon(Icons.search_rounded,
                        color: FounderLightTheme.textMuted, size: 18),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close_rounded, size: 16),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _searchQuery = '';
                                _currentPage = 1;
                              });
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: FounderLightTheme.surfaceAlt,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: FounderLightTheme.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: FounderLightTheme.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide:
                          const BorderSide(color: FounderLightTheme.borderFocus, width: 1.5),
                    ),
                  ),
                ),
              ),
              if (_hasActiveFilters) ...[
                const SizedBox(width: 12),
                TextButton.icon(
                  onPressed: _resetFilters,
                  icon: const Icon(Icons.restart_alt_rounded, size: 16),
                  label: const Text('Reset Filters'),
                  style: TextButton.styleFrom(
                    foregroundColor: FounderLightTheme.danger,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                  ),
                ),
              ],
            ],
          ),

          const SizedBox(height: 16),

          // Row 2: Jurisdiction, State Selector, Category, Status, Sort Controls
          Wrap(
            spacing: 12,
            runSpacing: 12,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              // Jurisdiction Segmented Control
              _buildJurisdictionSegmentedControl(),

              // Conditional State/UT Dropdown Selector
              if (_jurisdiction == JurisdictionFilter.state ||
                  _jurisdiction == JurisdictionFilter.ut ||
                  _jurisdiction == JurisdictionFilter.all)
                _buildStateSelectorDropdown(),

              // Category Filter Dropdown
              _buildDropdownFilter<String>(
                label: 'Category',
                value: _categoryFilter,
                items: const [
                  DropdownMenuItem(value: 'ALL', child: Text('All Categories')),
                  DropdownMenuItem(
                      value: 'COMPETITIVE', child: Text('Competitive')),
                  DropdownMenuItem(
                      value: 'QUALIFYING', child: Text('Qualifying')),
                  DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _categoryFilter = val;
                      _currentPage = 1;
                    });
                  }
                },
              ),

              // Status Filter Dropdown
              _buildDropdownFilter<MissionPortfolioFilter>(
                label: 'Status',
                value: _statusFilter,
                items: const [
                  DropdownMenuItem(
                      value: MissionPortfolioFilter.all, child: Text('All Statuses')),
                  DropdownMenuItem(
                      value: MissionPortfolioFilter.live,
                      child: Text('Live for Students')),
                  DropdownMenuItem(
                      value: MissionPortfolioFilter.draft,
                      child: Text('Founder Draft')),
                  DropdownMenuItem(
                      value: MissionPortfolioFilter.passive,
                      child: Text('Passive / Staged')),
                  DropdownMenuItem(
                      value: MissionPortfolioFilter.archived,
                      child: Text('Archived')),
                  DropdownMenuItem(
                      value: MissionPortfolioFilter.attention,
                      child: Text('Needs Attention')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _statusFilter = val;
                      _currentPage = 1;
                    });
                  }
                },
              ),

              // Sort Option Dropdown
              _buildDropdownFilter<SortOption>(
                label: 'Sort By',
                value: _sortBy,
                items: const [
                  DropdownMenuItem(
                      value: SortOption.recentlyUpdated,
                      child: Text('Recently Updated')),
                  DropdownMenuItem(
                      value: SortOption.alphabetical,
                      child: Text('Alphabetical (A-Z)')),
                  DropdownMenuItem(
                      value: SortOption.yearNewest,
                      child: Text('Year (Newest First)')),
                  DropdownMenuItem(
                      value: SortOption.yearOldest,
                      child: Text('Year (Oldest First)')),
                  DropdownMenuItem(
                      value: SortOption.status, child: Text('Status')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _sortBy = val);
                  }
                },
              ),

              // Items Per Page Picker
              _buildDropdownFilter<int>(
                label: 'Per Page',
                value: _pageSize,
                items: const [
                  DropdownMenuItem(value: 12, child: Text('12 / page')),
                  DropdownMenuItem(value: 24, child: Text('24 / page')),
                  DropdownMenuItem(value: 48, child: Text('48 / page')),
                  DropdownMenuItem(value: 96, child: Text('96 / page')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _pageSize = val;
                      _currentPage = 1;
                    });
                  }
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildJurisdictionSegmentedControl() {
    return Container(
      decoration: BoxDecoration(
        color: FounderLightTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: FounderLightTheme.border),
      ),
      padding: const EdgeInsets.all(3),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: JurisdictionFilter.values.map((filter) {
          final bool selected = _jurisdiction == filter;
          final String label = switch (filter) {
            JurisdictionFilter.all => 'ALL JURISDICTIONS',
            JurisdictionFilter.central => 'CENTRAL',
            JurisdictionFilter.state => 'STATE',
            JurisdictionFilter.ut => 'UT',
          };

          return InkWell(
            onTap: () {
              setState(() {
                _jurisdiction = filter;
                _selectedStateCode =
                    MissionInventoryLogic.reconcileStateCodeForJurisdiction(
                  newJurisdiction: filter,
                  currentStateCode: _selectedStateCode,
                );
                _currentPage = 1;
              });
            },
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: selected
                    ? FounderLightTheme.surface
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                boxShadow: selected ? FounderLightTheme.softShadow : null,
              ),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected
                      ? FounderLightTheme.primaryDark
                      : FounderLightTheme.textMuted,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildStateSelectorDropdown() {
    List<String> stateNames = [];
    if (_jurisdiction == JurisdictionFilter.state) {
      stateNames = IndiaStates.states;
    } else if (_jurisdiction == JurisdictionFilter.ut) {
      stateNames = IndiaStates.unionTerritories;
    } else {
      stateNames = IndiaStates.statesAndUTs;
    }

    return Container(
      height: 36,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: FounderLightTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: _selectedStateCode != null
              ? FounderLightTheme.primaryBlue
              : FounderLightTheme.border,
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String?>(
          value: _selectedStateCode,
          hint: Text(
            _jurisdiction == JurisdictionFilter.ut
                ? 'Select UT...'
                : _jurisdiction == JurisdictionFilter.state
                    ? 'Select State...'
                    : 'Filter State/UT...',
            style: const TextStyle(
                color: FounderLightTheme.textMuted, fontSize: 11),
          ),
          icon: const Icon(Icons.arrow_drop_down_rounded,
              color: FounderLightTheme.textMuted, size: 20),
          style: const TextStyle(
            color: FounderLightTheme.textPrimary,
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
          dropdownColor: FounderLightTheme.surface,
          items: [
            const DropdownMenuItem<String?>(
              value: null,
              child: Text('All States & UTs',
                  style: TextStyle(color: FounderLightTheme.textMuted)),
            ),
            ...stateNames.map((name) {
              final code = IndiaStates.getStateCode(name) ?? name;
              return DropdownMenuItem<String?>(
                value: code,
                child: Text('$name ($code)'),
              );
            }),
          ],
          onChanged: (code) {
            setState(() {
              _selectedStateCode = code;
              _currentPage = 1;
            });
          },
        ),
      ),
    );
  }

  Widget _buildDropdownFilter<T>({
    required String label,
    required T value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return Container(
      height: 36,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: FounderLightTheme.surfaceAlt,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: FounderLightTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: const TextStyle(
              color: FounderLightTheme.textMuted,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
          DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: value,
              icon: const Icon(Icons.arrow_drop_down_rounded,
                  color: FounderLightTheme.textMuted, size: 18),
              style: const TextStyle(
                color: FounderLightTheme.textPrimary,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              dropdownColor: FounderLightTheme.surface,
              items: items,
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }

  bool get _hasActiveFilters =>
      _searchQuery.isNotEmpty ||
      _jurisdiction != JurisdictionFilter.all ||
      _selectedStateCode != null ||
      _statusFilter != MissionPortfolioFilter.all ||
      _categoryFilter != 'ALL';

  // ===========================================================================
  // RESULTS AND ACTIVE TAGS BAR
  // ===========================================================================
  Widget _buildResultsAndTagsBar(
    int totalFiltered,
    int page,
    int totalPages,
    int startIndex,
    int endIndex,
  ) {
    final String rangeText = totalFiltered == 0
        ? '0 missions found'
        : 'Showing ${startIndex + 1}–$endIndex of $totalFiltered missions (Page $page of $totalPages)';

    return Row(
      children: [
        Text(
          rangeText,
          style: const TextStyle(
            color: FounderLightTheme.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                if (_jurisdiction != JurisdictionFilter.all)
                  _buildActiveTag(
                    'Jurisdiction: ${_jurisdiction.name.toUpperCase()}',
                    () => setState(() {
                      _jurisdiction = JurisdictionFilter.all;
                      _currentPage = 1;
                    }),
                  ),
                if (_selectedStateCode != null)
                  _buildActiveTag(
                    'State: ${IndiaStates.getDisplayName(_selectedStateCode) ?? _selectedStateCode}',
                    () => setState(() {
                      _selectedStateCode = null;
                      _currentPage = 1;
                    }),
                  ),
                if (_categoryFilter != 'ALL')
                  _buildActiveTag(
                    'Category: $_categoryFilter',
                    () => setState(() {
                      _categoryFilter = 'ALL';
                      _currentPage = 1;
                    }),
                  ),
                if (_statusFilter != MissionPortfolioFilter.all)
                  _buildActiveTag(
                    'Status: ${_statusFilter.name.toUpperCase()}',
                    () => setState(() {
                      _statusFilter = MissionPortfolioFilter.all;
                      _currentPage = 1;
                    }),
                  ),
                if (_searchQuery.isNotEmpty)
                  _buildActiveTag(
                    'Search: "$_searchQuery"',
                    () => setState(() {
                      _searchQuery = '';
                      _searchController.clear();
                      _currentPage = 1;
                    }),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveTag(String label, VoidCallback onRemove) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: FounderLightTheme.primaryBlueLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FounderLightTheme.primaryBlue.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: FounderLightTheme.primaryBlue,
            ),
          ),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close_rounded,
                size: 12, color: FounderLightTheme.primaryBlue),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // EMPTY STATE
  // ===========================================================================
  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FounderLightTheme.border),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: FounderLightTheme.surfaceAlt,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.search_off_rounded,
              size: 32,
              color: FounderLightTheme.textMuted,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No missions match your search / filter criteria.',
            style: TextStyle(
              color: FounderLightTheme.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Try adjusting your search keywords, jurisdiction, category, or status filters.',
            style: TextStyle(
              color: FounderLightTheme.textMuted,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: _resetFilters,
            icon: const Icon(Icons.restart_alt_rounded, size: 16),
            label: const Text('Reset All Filters'),
            style: OutlinedButton.styleFrom(
              foregroundColor: FounderLightTheme.primaryBlue,
              side: const BorderSide(color: FounderLightTheme.primaryBlue),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  // ===========================================================================
  // PAGINATION BAR
  // ===========================================================================
  Widget _buildPaginationBar(int currentPage, int totalPages, int totalItems) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: FounderLightTheme.border),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Page $currentPage of $totalPages  ($totalItems total items)',
            style: const TextStyle(
              color: FounderLightTheme.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.first_page_rounded, size: 20),
                onPressed: currentPage > 1
                    ? () => setState(() => _currentPage = 1)
                    : null,
                tooltip: 'First Page',
              ),
              IconButton(
                icon: const Icon(Icons.chevron_left_rounded, size: 20),
                onPressed: currentPage > 1
                    ? () => setState(() => _currentPage--)
                    : null,
                tooltip: 'Previous Page',
              ),
              const SizedBox(width: 8),

              // Page Number Buttons
              ...List.generate(totalPages, (i) {
                final pageNum = i + 1;
                if (pageNum == 1 ||
                    pageNum == totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  final bool isCurrent = pageNum == currentPage;
                  return InkWell(
                    onTap: () => setState(() => _currentPage = pageNum),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? FounderLightTheme.primaryDark
                            : FounderLightTheme.surfaceAlt,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '$pageNum',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight:
                              isCurrent ? FontWeight.w700 : FontWeight.w500,
                          color: isCurrent
                              ? Colors.white
                              : FounderLightTheme.textSecondary,
                        ),
                      ),
                    ),
                  );
                } else if (pageNum == currentPage - 2 ||
                    pageNum == currentPage + 2) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 2),
                    child: Text('...',
                        style: TextStyle(
                            color: FounderLightTheme.textMuted, fontSize: 11)),
                  );
                }
                return const SizedBox.shrink();
              }),

              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.chevron_right_rounded, size: 20),
                onPressed: currentPage < totalPages
                    ? () => setState(() => _currentPage++)
                    : null,
                tooltip: 'Next Page',
              ),
              IconButton(
                icon: const Icon(Icons.last_page_rounded, size: 20),
                onPressed: currentPage < totalPages
                    ? () => setState(() => _currentPage = totalPages)
                    : null,
                tooltip: 'Last Page',
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<MissionInventoryRecord> _reconcile(
    List<QueryDocumentSnapshot<Map<String, dynamic>>> realms,
  ) {
    final byId = <String, MissionInventoryRecord>{};
    for (final doc in realms) {
      byId.putIfAbsent(doc.id, () => MissionInventoryRecord(doc.id)).realm =
          doc.data();
    }
    return byId.values.toList();
  }
}

// =============================================================================
// RECORD DATA MODEL WITH JURISDICTION EXPANSION & REAL TIMESTAMP PROJECTION
// =============================================================================
class MissionInventoryRecord {
  MissionInventoryRecord(this.id);
  final String id;
  Map<String, dynamic>? realm;
  // Legacy projections are intentionally not read by Founder runtime UI.
  // The canonical mission_realms snapshot is the only source of truth.
  Map<String, dynamic>? recruitment;
  Map<String, dynamic>? catalog;

  bool get studentVisible =>
      realm?['archived'] != true &&
      (realm?['cardVisible'] == true ||
          realm?['userPanelVisible'] == true ||
          (realm?['visibilityGate'] is Map &&
              ((realm?['visibilityGate'] as Map)['studentVisible'] == true ||
                  (realm?['visibilityGate'] as Map)['userPanelVisible'] ==
                      true)));

  String get rawStatus => (realm?['studentPublicationState'] ??
          realm?['status'] ??
          'DRAFT')
      .toString()
      .toUpperCase();

  MissionPortfolioFilter get kind {
    if (studentVisible) return MissionPortfolioFilter.live;
    if (rawStatus == 'ARCHIVED') return MissionPortfolioFilter.archived;
    if (rawStatus == 'PASSIVE' || rawStatus == 'HIDDEN') {
      return MissionPortfolioFilter.passive;
    }
    return MissionPortfolioFilter.draft;
  }

  bool get hasCanonicalVariables =>
      [realm].whereType<Map<String, dynamic>>().any((s) =>
          s['missionVariables'] is Map &&
          (s['missionVariables'] as Map).isNotEmpty);

  bool get hasLegacyVariables =>
      false;

  bool get sourceReady =>
      [realm].whereType<Map<String, dynamic>>().any((s) =>
          s['canonicalSourceVersionId'] != null ||
          s['sourceAuthorityState'] == 'CANONICAL');

  bool get sourceCandidate =>
      [realm].whereType<Map<String, dynamic>>().any(
          (s) => s['sourceVersionId'] != null || s['sourceDocumentId'] != null);

  bool get needsAttention =>
      realm == null ||
      (!sourceReady && !sourceCandidate) ||
      (!hasCanonicalVariables && !hasLegacyVariables);

  String get displayName => (realm?['displayName'] ??
          realm?['title'] ??
          realm?['exam_name'] ??
          realm?['recruitment_name'] ??
          id)
      .toString();

  String get organization => (realm?['organization'] ??
          realm?['org'] ??
          '')
      .toString();

  String get year => (realm?['examYear'] ??
          realm?['year'] ??
          realm?['exam_year'] ??
          'YEAR PENDING')
      .toString();

  String get category => (realm?['examCategory'] ??
          realm?['exam_category'] ??
          realm?['exam_category'] ??
          'CATEGORY PENDING')
      .toString();

  // Governed Jurisdiction Resolution (ZERO text-based name heuristics)
  String? get rawJurisdiction => (realm?['jurisdictionLevel'] ??
          realm?['jurisdiction'] ??
          realm?['jurisdictionLevel'] ??
          realm?['jurisdiction'])
      ?.toString()
      .toUpperCase();

  String? get stateCode {
    final raw = (realm?['stateCode'] ??
            realm?['state_code'] ??
            realm?['stateCode'] ??
            realm?['state_code'])
        ?.toString()
        .trim()
        .toUpperCase();
    if (raw != null && raw.isNotEmpty && raw != 'NULL' && raw != 'NONE') {
      return raw;
    }
    return null;
  }

  bool get isCentral {
    if (rawJurisdiction == 'CENTRAL') return true;
    if (rawJurisdiction == null && stateCode == null) {
      final isCentralFlag = realm?['isCentralAuthority'];
      if (isCentralFlag == true) return true;
    }
    return false;
  }

  bool get isState {
    if (rawJurisdiction == 'STATE') return true;
    if (stateCode != null && IndiaStates.isStateCode(stateCode)) return true;
    return false;
  }

  bool get isUt {
    if (rawJurisdiction == 'UT') return true;
    if (stateCode != null && IndiaStates.isUnionTerritoryCode(stateCode)) {
      return true;
    }
    return false;
  }

  String get jurisdictionBadgeLabel {
    if (isCentral) return 'CENTRAL';
    if (stateCode != null) {
      return '${isUt ? 'UT' : 'STATE'} · $stateCode';
    }
    if (isState) return 'STATE';
    if (isUt) return 'UT';
    return 'UNCLASSIFIED';
  }

  /// Real update timestamp projection (ZERO createdAt fallback)
  DateTime? get latestUpdatedAt {
    DateTime? parseVal(dynamic val) {
      if (val == null) return null;
      if (val is Timestamp) return val.toDate();
      if (val is DateTime) return val;
      if (val is int) return DateTime.fromMillisecondsSinceEpoch(val);
      if (val is String) {
        final parsed = DateTime.tryParse(val);
        if (parsed != null) return parsed;
        final intVal = int.tryParse(val);
        if (intVal != null) return DateTime.fromMillisecondsSinceEpoch(intVal);
      }
      return null;
    }

    final times = [parseVal(realm?['updatedAt'] ?? realm?['updated_at'])]
        .whereType<DateTime>()
        .toList();

    if (times.isEmpty) return null;
    times.sort((a, b) => b.compareTo(a));
    return times.first;
  }

  String get lifecycleLabel => switch (kind) {
        MissionPortfolioFilter.live => 'LIVE FOR STUDENTS',
        MissionPortfolioFilter.draft => 'FOUNDER DRAFT',
        MissionPortfolioFilter.passive => 'PASSIVE',
        MissionPortfolioFilter.archived => 'ARCHIVED',
        MissionPortfolioFilter.all => rawStatus,
        MissionPortfolioFilter.attention => rawStatus,
      };

  String get authorityLabel =>
      realm == null ? 'AUTHORITY REPAIR REQUIRED' : 'AUTHORITY CONNECTED';

  String get sourceLabel => sourceReady
      ? 'SOURCE CANONICAL'
      : sourceCandidate
          ? 'SOURCE CANDIDATE'
          : 'NO OFFICIAL SOURCE';

  String get variablesLabel => hasCanonicalVariables
      ? 'VARIABLES READY'
      : hasLegacyVariables
          ? 'VARIABLE REVIEW REQUIRED'
          : 'STRUCTURE UNKNOWN';

  String get pipelineLabel {
    final locks = (catalog?['contentLocks'] ?? realm?['contentLocks']) as Map?;
    return locks != null && locks.values.any((v) => v == true)
        ? 'PIPELINE CONNECTED'
        : 'PIPELINE NOT READY';
  }
}

// =============================================================================
// MISSION PORTFOLIO CARD (LIGHT OPERATIONAL THEME)
// =============================================================================
class _MissionPortfolioCard extends StatelessWidget {
  const _MissionPortfolioCard({required this.row, required this.onSelected});
  final MissionInventoryRecord row;
  final ValueChanged<String>? onSelected;

  @override
  Widget build(BuildContext context) {
    final statusColor = row.studentVisible
        ? FounderLightTheme.success
        : row.kind == MissionPortfolioFilter.archived
            ? FounderLightTheme.textMuted
            : row.kind == MissionPortfolioFilter.passive
                ? FounderLightTheme.warning
                : FounderLightTheme.primaryBlue;

    return Container(
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: FounderLightTheme.border),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Title, ID, and Action Menu
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        row.displayName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: FounderLightTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      SelectableText(
                        '${row.year}  •  ${row.id}',
                        maxLines: 1,
                        style: const TextStyle(
                          fontSize: 11,
                          color: FounderLightTheme.textMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  tooltip: 'Mission actions',
                  icon: const Icon(Icons.more_vert_rounded,
                      size: 20, color: FounderLightTheme.textMuted),
                  onSelected: (action) => _handleAction(context, action),
                  itemBuilder: (_) => [
                    const PopupMenuItem(
                        value: 'open', child: Text('Open mission')),
                    if (row.kind == MissionPortfolioFilter.archived)
                      const PopupMenuItem(
                          value: 'restore', child: Text('Restore')),
                    if (row.kind != MissionPortfolioFilter.archived)
                      const PopupMenuItem(
                          value: 'archive', child: Text('Archive')),
                    const PopupMenuDivider(),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Text('Delete permanently',
                          style: TextStyle(color: FounderLightTheme.danger)),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Badges Row
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                // Jurisdiction Badge
                _badge(
                  row.jurisdictionBadgeLabel,
                  row.jurisdictionBadgeLabel == 'UNCLASSIFIED'
                      ? FounderLightTheme.textMuted
                      : FounderLightTheme.info,
                  row.jurisdictionBadgeLabel == 'UNCLASSIFIED'
                      ? FounderLightTheme.neutralBg
                      : FounderLightTheme.infoBg,
                ),

                // Lifecycle Status Badge
                _badge(
                  row.lifecycleLabel,
                  statusColor,
                  statusColor == FounderLightTheme.success
                      ? FounderLightTheme.successBg
                      : statusColor == FounderLightTheme.warning
                          ? FounderLightTheme.warningBg
                          : statusColor == FounderLightTheme.primaryBlue
                              ? FounderLightTheme.primaryBlueLight
                              : FounderLightTheme.neutralBg,
                ),

                if (row.id.toLowerCase().contains('test'))
                  _badge('TEST', FounderLightTheme.warning,
                      FounderLightTheme.warningBg),

                if (row.needsAttention)
                  _badge('NEEDS ATTENTION', FounderLightTheme.danger,
                      FounderLightTheme.dangerBg),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(color: FounderLightTheme.borderSubtle, height: 1),
            const SizedBox(height: 12),

            // Fact Verification Rows
            _truth(
              'AUTHORITY',
              row.authorityLabel,
              row.realm == null
                  ? FounderLightTheme.warning
                  : FounderLightTheme.textSecondary,
            ),
            _truth(
              'SOURCE DOC',
              row.sourceLabel,
              row.sourceReady
                  ? FounderLightTheme.success
                  : FounderLightTheme.warning,
            ),
            _truth(
              'VARIABLES',
              row.variablesLabel,
              row.hasCanonicalVariables
                  ? FounderLightTheme.success
                  : FounderLightTheme.warning,
            ),
            _truth(
              'DELIVERY',
              row.pipelineLabel,
              FounderLightTheme.textSecondary,
            ),

            const SizedBox(height: 16),

            // Action Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => onSelected?.call(row.id),
                icon: const Icon(Icons.arrow_forward_rounded, size: 14),
                label: const Text('OPEN MISSION'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: FounderLightTheme.primaryDark,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleAction(BuildContext context, String action) async {
    if (action == 'open') {
      onSelected?.call(row.id);
      return;
    }
    if (action == 'delete') {
      await _deleteDialog(context);
      return;
    }
    final callableAction =
        action == 'restore' ? 'restore_realm' : 'archive_realm';
    try {
      await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('handleSentinelAction')
          .call({
        'action': callableAction,
        'recruitmentId': row.id,
        'payload': {
          'reason': 'Founder portfolio governed $action request',
          'requestId': 'portfolio-${DateTime.now().microsecondsSinceEpoch}'
        },
      });
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$action blocked: $error')));
      }
    }
  }

  Future<void> _deleteDialog(BuildContext context) async {
    final identity = TextEditingController();
    final reason = TextEditingController();
    final confirmed = await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
              backgroundColor: FounderLightTheme.surface,
              title: const Text('PERMANENT DELETE PREFLIGHT',
                  style: TextStyle(color: FounderLightTheme.textPrimary)),
              content: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Deletion is allowed only when Student history, sources, academic content, publication history and active jobs are absent.',
                      style: TextStyle(color: FounderLightTheme.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    Text('Type ${row.id} to confirm.',
                        style: const TextStyle(
                            color: FounderLightTheme.textPrimary,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextField(
                        controller: identity,
                        decoration: const InputDecoration(
                            labelText: 'Mission ID confirmation',
                            border: OutlineInputBorder())),
                    const SizedBox(height: 8),
                    TextField(
                        controller: reason,
                        minLines: 2,
                        maxLines: 3,
                        decoration: const InputDecoration(
                            labelText:
                                'Founder reason (minimum 12 characters)',
                            border: OutlineInputBorder())),
                  ]),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(dialogContext, false),
                    child: const Text('CANCEL')),
                FilledButton(
                    onPressed: () {
                      if (identity.text.trim() == row.id &&
                          reason.text.trim().length >= 12) {
                        Navigator.pop(dialogContext, true);
                      }
                    },
                    style: FilledButton.styleFrom(
                        backgroundColor: FounderLightTheme.danger),
                    child: const Text('RUN PREFLIGHT AND DELETE'))
              ],
            ));
    if (confirmed != true || !context.mounted) {
      identity.dispose();
      reason.dispose();
      return;
    }
    try {
      await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('handleSentinelAction')
          .call({
        'action': 'delete_realm_permanently',
        'recruitmentId': row.id,
        'payload': {
          'reason': reason.text.trim(),
          'missionIdentityConfirmation': identity.text.trim(),
          'requestId':
              'portfolio-delete-${DateTime.now().microsecondsSinceEpoch}'
        },
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('${row.id} deleted after dependency preflight.')));
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Delete blocked: $error')));
      }
    }
    identity.dispose();
    reason.dispose();
  }

  Widget _truth(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              color: FounderLightTheme.textMuted,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 10,
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _badge(String label, Color fgColor, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: fgColor.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fgColor,
          fontSize: 9,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

// =============================================================================
// HELPER WIDGETS
// =============================================================================
class _MetricCard extends StatelessWidget {
  const _MetricCard(this.label, this.value, this.color, this.icon);
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 170,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: FounderLightTheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: FounderLightTheme.border),
        boxShadow: FounderLightTheme.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                value,
                style: TextStyle(
                  color: color,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Icon(icon, color: color.withValues(alpha: 0.7), size: 18),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: const TextStyle(
              color: FounderLightTheme.textMuted,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _InventoryLoadingState extends StatelessWidget {
  const _InventoryLoadingState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: const Center(
        child: Column(
          children: [
            CircularProgressIndicator(
              color: FounderLightTheme.primaryDark,
              strokeWidth: 2.5,
            ),
            SizedBox(height: 16),
            Text(
              'Loading Founder Mission Inventory...',
              style: TextStyle(
                color: FounderLightTheme.textMuted,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InventoryErrorState extends StatelessWidget {
  const _InventoryErrorState({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: FounderLightTheme.dangerBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: FounderLightTheme.danger.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded,
              color: FounderLightTheme.danger, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: FounderLightTheme.danger,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

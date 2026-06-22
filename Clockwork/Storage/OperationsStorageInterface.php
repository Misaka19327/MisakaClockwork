<?php namespace Clockwork\Storage;

// Interface for operation-centric storage implementations, where the 7 operation categories
// (database / cache / redis / log / events / views / notifications) are stored as first-class
// rows and can be queried and aggregated independently of the originating request.
interface OperationsStorageInterface
{
    // Return operations for a category, as flat rows each carrying an originating-request
    // back-reference. Supports an optional Search (request-level filtering) and a row limit.
    public function operations($category, ?Search $search = null, $limit = null);

    // Return single-category KPIs (counts, duration aggregates, sub-type breakdowns), aligned
    // with the buildOperationsKpis shape used by the operations center.
    public function operationStats($category, ?Search $search = null);

    // Return cross-category overview stats aligned with getStats (counts per category, failure
    // rate — approximate under SQL, see overviewStats risk note in the plan).
    public function overviewStats(?Search $search = null);
}

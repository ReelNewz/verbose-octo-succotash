"""
AI Readiness Score Analyzer — Python serverless function.
POST /api/analyze

Computes AI readiness sub-scores using a rule-based algorithm.
Returns instant score estimates before Claude finishes generating the full audit.

Body (JSON):
  industry         - string
  employeeCount    - string  (e.g. "1-10", "11-50", "51-200", "201-500", "500+")
  annualRevenue    - string  (optional)
  currentChallenges - string
  currentTools     - string  (optional)
  goals            - string
"""

import json
import sys

# ---------------------------------------------------------------------------
# Score tables
# ---------------------------------------------------------------------------

# Industry baseline scores (data maturity, process maturity, team readiness, tech infra)
INDUSTRY_BASELINES = {
    "technology": (75, 70, 75, 80),
    "tech": (75, 70, 75, 80),
    "software": (75, 70, 75, 80),
    "saas": (75, 70, 75, 80),
    "finance": (70, 65, 65, 70),
    "financial services": (70, 65, 65, 70),
    "banking": (68, 62, 60, 68),
    "healthcare": (65, 60, 60, 65),
    "medical": (65, 60, 60, 65),
    "pharma": (65, 62, 60, 65),
    "pharmaceutical": (65, 62, 60, 65),
    "e-commerce": (68, 65, 60, 70),
    "ecommerce": (68, 65, 60, 70),
    "retail": (55, 55, 50, 55),
    "manufacturing": (50, 55, 45, 55),
    "logistics": (55, 58, 50, 58),
    "supply chain": (55, 58, 50, 58),
    "education": (50, 50, 55, 50),
    "legal": (45, 50, 50, 50),
    "law": (45, 50, 50, 50),
    "real estate": (45, 50, 45, 48),
    "construction": (40, 45, 40, 42),
    "hospitality": (45, 48, 45, 45),
    "restaurant": (40, 45, 40, 42),
    "food & beverage": (45, 48, 45, 45),
    "marketing": (60, 60, 62, 62),
    "advertising": (60, 58, 60, 60),
    "media": (58, 55, 58, 60),
    "consulting": (55, 58, 60, 55),
    "hr": (50, 52, 55, 50),
    "human resources": (50, 52, 55, 50),
    "insurance": (62, 58, 55, 60),
    "automotive": (55, 58, 50, 58),
    "agriculture": (40, 42, 38, 40),
    "energy": (58, 60, 52, 60),
    "utilities": (55, 58, 48, 58),
    "non-profit": (40, 42, 45, 38),
    "nonprofit": (40, 42, 45, 38),
}

DEFAULT_BASELINE = (50, 50, 50, 50)

# Employee count adjustments (delta to each sub-score)
EMPLOYEE_ADJUSTMENTS = {
    "1-10": -10,
    "1-9": -10,
    "2-10": -10,
    "11-50": -5,
    "10-49": -5,
    "51-200": 0,
    "50-199": 0,
    "201-500": 5,
    "200-499": 5,
    "500+": 10,
    "501+": 10,
    "1000+": 15,
}

# Revenue adjustments (delta to overall score)
REVENUE_ADJUSTMENTS = {
    "under $100k": -10,
    "<$100k": -10,
    "$100k-$500k": -5,
    "$100k-500k": -5,
    "$500k-$1m": 0,
    "$1m-$5m": 5,
    "$5m-$10m": 8,
    "$10m-$50m": 10,
    "$50m+": 12,
    "$100m+": 15,
}

# Digital tools that add points to techInfrastructure and processMaturity
TECH_TOOLS_KEYWORDS = [
    "crm", "erp", "salesforce", "hubspot", "zendesk", "slack", "teams",
    "microsoft 365", "google workspace", "g suite", "jira", "asana", "monday",
    "tableau", "power bi", "looker", "analytics", "database", "sql", "cloud",
    "aws", "azure", "gcp", "google cloud", "automation", "zapier", "make",
    "integromat", "airtable", "notion", "clickup", "quickbooks", "xero",
    "shopify", "woocommerce", "magento", "wordpress", "stripe", "paypal",
    "twilio", "sendgrid", "mailchimp", "hubspot", "marketo", "segment",
    "mixpanel", "amplitude", "datadog", "splunk", "elasticsearch",
]

# Challenge keywords that indicate opportunity (increase score slightly — business is aware)
OPPORTUNITY_CHALLENGE_KEYWORDS = [
    "manual", "repetitive", "time-consuming", "inefficient", "data silo",
    "siloed", "reporting", "spreadsheet", "excel", "paper", "slow", "bottleneck",
    "communication", "tracking", "inventory", "forecasting", "scheduling",
    "customer service", "support tickets", "onboarding", "compliance",
    "documentation", "hiring", "recruitment", "churn", "retention",
]

# Keywords that indicate higher team readiness
TECH_SAVVY_KEYWORDS = [
    "developer", "engineer", "technical", "software", "data", "analytics",
    "it department", "digital", "online", "platform", "api", "integration",
    "automation", "cloud", "saas",
]

# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def get_industry_baseline(industry: str):
    if not industry:
        return DEFAULT_BASELINE
    lower = industry.lower().strip()
    # Exact match first
    if lower in INDUSTRY_BASELINES:
        return INDUSTRY_BASELINES[lower]
    # Partial match
    for key, val in INDUSTRY_BASELINES.items():
        if key in lower or lower in key:
            return val
    return DEFAULT_BASELINE


def get_employee_adjustment(employee_count: str) -> int:
    if not employee_count:
        return 0
    lower = employee_count.lower().strip().replace(" ", "")
    # Direct lookup
    if lower in EMPLOYEE_ADJUSTMENTS:
        return EMPLOYEE_ADJUSTMENTS[lower]
    # Parse numeric ranges
    import re
    nums = re.findall(r"\d+", lower)
    if nums:
        n = int(nums[0])
        if n <= 10:
            return -10
        elif n <= 50:
            return -5
        elif n <= 200:
            return 0
        elif n <= 500:
            return 5
        else:
            return 10
    return 0


def get_revenue_adjustment(annual_revenue: str) -> int:
    if not annual_revenue:
        return 0
    lower = annual_revenue.lower().strip()
    for key, val in REVENUE_ADJUSTMENTS.items():
        if key.lower() in lower:
            return val
    # Parse millions
    import re
    m_match = re.search(r"\$?([\d.]+)\s*m", lower)
    if m_match:
        millions = float(m_match.group(1))
        if millions < 1:
            return -3
        elif millions < 5:
            return 5
        elif millions < 10:
            return 8
        elif millions < 50:
            return 10
        else:
            return 12
    return 0


def count_tools(current_tools: str) -> int:
    """Count how many known digital tools are mentioned."""
    if not current_tools:
        return 0
    lower = current_tools.lower()
    count = 0
    for tool in TECH_TOOLS_KEYWORDS:
        if tool in lower:
            count += 1
    return count


def count_keywords(text: str, keywords: list) -> int:
    if not text:
        return 0
    lower = text.lower()
    return sum(1 for kw in keywords if kw in lower)


def clamp(value: int, min_val: int = 0, max_val: int = 100) -> int:
    return max(min_val, min(max_val, value))


def compute_scores(
    industry: str,
    employee_count: str,
    annual_revenue: str,
    current_challenges: str,
    current_tools: str,
    goals: str,
) -> dict:
    # Base scores from industry
    base_data, base_process, base_team, base_tech = get_industry_baseline(industry)

    # Employee size adjustment
    emp_adj = get_employee_adjustment(employee_count)

    # Revenue adjustment
    rev_adj = get_revenue_adjustment(annual_revenue)

    # Tools adjustment
    tool_count = count_tools(current_tools)
    # Each tool adds up to 3 points across tech and process, diminishing returns
    tools_tech_adj = min(tool_count * 3, 15)
    tools_process_adj = min(tool_count * 2, 10)
    tools_data_adj = min(tool_count * 1, 8)

    # Challenge keywords — awareness of pain points is a good signal
    challenge_hit = count_keywords(current_challenges, OPPORTUNITY_CHALLENGE_KEYWORDS)
    challenge_adj = min(challenge_hit * 2, 8)

    # Team readiness from goals/tools keywords
    tech_savvy_combined = (current_tools or '') + ' ' + (goals or '')
    tech_savvy_hit = count_keywords(tech_savvy_combined, TECH_SAVVY_KEYWORDS)
    team_adj = min(tech_savvy_hit * 2, 10)

    # Compute sub-scores
    data_maturity = clamp(
        base_data + emp_adj + tools_data_adj + challenge_adj // 2 + rev_adj // 2
    )
    process_maturity = clamp(
        base_process + emp_adj + tools_process_adj + challenge_adj + rev_adj // 2
    )
    team_readiness = clamp(
        base_team + emp_adj // 2 + team_adj + rev_adj // 3
    )
    technical_infrastructure = clamp(
        base_tech + emp_adj + tools_tech_adj + rev_adj // 2
    )

    # Weighted overall score
    # Weights: data 25%, process 30%, team 20%, tech 25%
    overall = round(
        data_maturity * 0.25
        + process_maturity * 0.30
        + team_readiness * 0.20
        + technical_infrastructure * 0.25
    )
    overall = clamp(overall)

    return {
        "dataMaturity": data_maturity,
        "processMaturity": process_maturity,
        "teamReadiness": team_readiness,
        "technicalInfrastructure": technical_infrastructure,
        "overall": overall,
        "meta": {
            "industryDetected": industry,
            "employeeAdjustment": emp_adj,
            "toolsDetected": tool_count,
            "revenueAdjustment": rev_adj,
        },
    }


# ---------------------------------------------------------------------------
# Vercel serverless handler
# ---------------------------------------------------------------------------

def handler(request, response):
    """Vercel Python serverless function entry point."""
    import json as _json

    # CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"

    if request.method == "OPTIONS":
        response.status_code = 200
        response.body = ""
        return

    if request.method != "POST":
        response.status_code = 405
        response.body = _json.dumps({"error": "Method not allowed"})
        response.headers["Content-Type"] = "application/json"
        return

    try:
        if hasattr(request, "body"):
            raw = request.body
        else:
            raw = request.read() if hasattr(request, "read") else b""

        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")

        body = _json.loads(raw) if raw else {}
    except Exception as e:
        response.status_code = 400
        response.body = _json.dumps({"error": f"Invalid JSON body: {str(e)}"})
        response.headers["Content-Type"] = "application/json"
        return

    industry = body.get("industry", "")
    employee_count = body.get("employeeCount", "")
    annual_revenue = body.get("annualRevenue", "")
    current_challenges = body.get("currentChallenges", "")
    current_tools = body.get("currentTools", "")
    goals = body.get("goals", "")

    scores = compute_scores(
        industry=industry,
        employee_count=employee_count,
        annual_revenue=annual_revenue,
        current_challenges=current_challenges,
        current_tools=current_tools,
        goals=goals,
    )

    response.status_code = 200
    response.body = _json.dumps(scores)
    response.headers["Content-Type"] = "application/json"


# ---------------------------------------------------------------------------
# WSGI / HTTP compatibility shim for Vercel Python runtime
# ---------------------------------------------------------------------------

def app(environ, start_response):
    """WSGI entry point for Vercel Python 3.12 runtime."""
    import io

    method = environ.get("REQUEST_METHOD", "GET")
    content_length = int(environ.get("CONTENT_LENGTH") or 0)
    raw_body = environ["wsgi.input"].read(content_length) if content_length else b""

    # Build a simple request-like object
    class Req:
        pass

    class Res:
        def __init__(self):
            self.status_code = 200
            self.headers = {"Content-Type": "application/json"}
            self.body = ""

    req = Req()
    req.method = method
    req.body = raw_body

    res = Res()
    handler(req, res)

    status_map = {
        200: "200 OK",
        400: "400 Bad Request",
        405: "405 Method Not Allowed",
        500: "500 Internal Server Error",
    }
    status_str = status_map.get(res.status_code, f"{res.status_code} Unknown")
    headers = [(k, v) for k, v in res.headers.items()]

    start_response(status_str, headers)
    body_bytes = res.body.encode("utf-8") if isinstance(res.body, str) else res.body
    return [body_bytes]

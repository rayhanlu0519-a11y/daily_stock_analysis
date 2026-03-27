# -*- coding: utf-8 -*-
"""
市场能力分层声明

定义每种 analysis_type × market 的能力矩阵，
Pipeline 在分析前查询以决定走正常/受限/阻塞路径。
"""

from typing import Dict

# "full"：正常流程
# "limited"：注入 prompt 提示 + 前端 badge
# "blocked"：拒绝分析并返回错误信息
CAPABILITY_MATRIX: Dict[str, Dict[str, str]] = {
    "short_term": {"cn": "full", "hk": "full", "us": "full"},
    "speculation": {"cn": "full", "hk": "full", "us": "full"},
    "value": {"cn": "full", "hk": "limited", "us": "limited"},
}


def get_market_capability(analysis_type: str, market: str) -> str:
    """查询能力矩阵，返回 full/limited/blocked。"""
    profile = CAPABILITY_MATRIX.get(analysis_type, {})
    return profile.get(market, "blocked")

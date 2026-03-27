# -*- coding: utf-8 -*-
"""
===================================
枚举类型定义
===================================

集中管理系统中使用的枚举类型，提供类型安全和代码可读性。
"""

from enum import Enum


class AnalysisType(str, Enum):
    """
    分析模式枚举

    区分不同投资风格的分析路径。
    """
    SHORT_TERM = "short_term"    # 短期趋势交易（1-3天，1-2周）
    SPECULATION = "speculation"  # 事件驱动投机（2周-1月）
    VALUE = "value"              # 巴菲特风格价值投资（3-10年）

    @classmethod
    def from_str(cls, value: str) -> "AnalysisType":
        """从字符串安全地转换为枚举值，无效输入返回默认值 SHORT_TERM。"""
        try:
            return cls(value.lower().strip())
        except (ValueError, AttributeError):
            return cls.SHORT_TERM


class ReportType(str, Enum):
    """
    报告类型枚举

    用于 API 触发分析时选择推送的报告格式。
    继承 str 使其可以直接与字符串比较和序列化。
    """
    SIMPLE = "simple"  # 精简报告：使用 generate_single_stock_report
    FULL = "full"      # 完整报告：使用 generate_dashboard_report
    BRIEF = "brief"    # 简洁模式：3-5 句话概括，适合移动端/推送

    @classmethod
    def from_str(cls, value: str) -> "ReportType":
        """
        从字符串安全地转换为枚举值
        
        Args:
            value: 字符串值
            
        Returns:
            对应的枚举值，无效输入返回默认值 SIMPLE
        """
        try:
            normalized = value.lower().strip()
            if normalized == "detailed":
                normalized = cls.FULL.value
            return cls(normalized)
        except (ValueError, AttributeError):
            return cls.SIMPLE
    
    @property
    def display_name(self) -> str:
        """获取用于显示的名称"""
        return {
            ReportType.SIMPLE: "精简报告",
            ReportType.FULL: "完整报告",
            ReportType.BRIEF: "简洁报告",
        }.get(self, "精简报告")

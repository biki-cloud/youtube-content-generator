"use client";

import { useState } from "react";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "pending" | "current" | "completed";
  component?: string;
}

interface StepGuideProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
}

export default function StepGuide({
  steps,
  currentStep,
  onStepClick,
}: StepGuideProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === currentStep);

    // 全て完了している場合
    if (currentStep === "completed") {
      return "completed";
    }

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#28a745";
      case "current":
        return "#007bff";
      default:
        return "#6c757d";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "current":
        return "🔄";
      default:
        return "⭕";
    }
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #dee2e6",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "bold",
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          📋 制作手順ガイド
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: "4px 8px",
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {isExpanded ? "折りたたむ" : "展開"}
        </button>
      </div>

      {isExpanded && (
        <div style={{ display: "grid", gap: "12px" }}>
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const statusColor = getStatusColor(status);
            const statusIcon = getStatusIcon(status);

            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: status === "current" ? "#e3f2fd" : "#f8f9fa",
                  borderRadius: "8px",
                  border: `2px solid ${
                    status === "current" ? "#007bff" : "transparent"
                  }`,
                  cursor: onStepClick ? "pointer" : "default",
                  transition: "all 0.2s ease",
                }}
                onClick={() => onStepClick?.(step.id)}
                onMouseEnter={(e) => {
                  if (onStepClick) {
                    e.currentTarget.style.backgroundColor =
                      status === "current" ? "#bbdefb" : "#e9ecef";
                  }
                }}
                onMouseLeave={(e) => {
                  if (onStepClick) {
                    e.currentTarget.style.backgroundColor =
                      status === "current" ? "#e3f2fd" : "#f8f9fa";
                  }
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: statusColor,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {status === "completed" ? "✓" : index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{step.icon}</span>
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: status === "current" ? "#007bff" : "#333",
                      }}
                    >
                      {step.title}
                    </h4>
                    <span style={{ fontSize: "12px" }}>{statusIcon}</span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: "#666",
                      lineHeight: 1.4,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: "#666",
            textAlign: "center",
          }}
        >
          💡
          各ステップをクリックすると、該当するコンポーネントにスクロールします
        </div>
      </div>
    </div>
  );
}

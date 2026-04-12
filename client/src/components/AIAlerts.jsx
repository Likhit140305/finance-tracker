import React from 'react';
import { AlertCircle, AlertTriangle, Lightbulb, Activity, Zap } from 'lucide-react';

const AIAlerts = ({ aiData }) => {
    if (!aiData) return null;

    const { anomalies, savingsTips, prediction, healthScore } = aiData;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Savings Tips (Middle-class mode) */}
            {savingsTips && savingsTips.length > 0 && (
                <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)', backgroundColor: 'var(--bg-glass)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Lightbulb size={18} color="var(--primary)" />
                        <h4 style={{ margin: 0, color: 'var(--primary)' }}>AI Financial Tip</h4>
                    </div>
                    {savingsTips.map((tip, idx) => (
                        <p key={idx} style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{tip}</p>
                    ))}
                </div>
            )}

            {/* AI Prediction */}
            {prediction > 0 && (
                <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent)', backgroundColor: 'var(--bg-glass)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Activity size={18} color="var(--accent)" />
                        <h4 style={{ margin: 0, color: 'var(--accent)' }}>Predicted Trend</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Based on your 3-month history, we project your next month's average expense to be around <strong style={{ color: "var(--text-primary)" }}>₹{prediction.toLocaleString('en-IN')}</strong>.
                    </p>
                </div>
            )}

            {/* Anomalies */}
            {anomalies && anomalies.length > 0 && anomalies.slice(0, 3).map((anomaly, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--warning-bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <AlertTriangle size={18} color="var(--warning)" />
                        <h4 style={{ margin: 0, color: 'var(--warning)' }}>Unusual Spending Alert</h4>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{anomaly.message}</p>
                </div>
            ))}
        </div>
    );
};

export default AIAlerts;

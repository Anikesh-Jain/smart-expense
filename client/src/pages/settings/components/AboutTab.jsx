import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import {
  FiCheckCircle,
  FiCpu,
  FiLayers
} from 'react-icons/fi';

const TECH_STACK = [
  { name: 'React', version: 'v19.2.8', role: 'Frontend UI Framework' },
  { name: 'Vite', version: 'v8.2.2', role: 'Frontend Tooling & Bundler' },
  { name: 'Redux Toolkit', version: 'v2.12.0', role: 'Global State Management' },
  { name: 'React Router DOM', version: 'v7.18.3', role: 'Client Routing' },
  { name: 'Tailwind CSS', version: 'v3.4.19', role: 'Styling & Design System' },
  { name: 'Recharts', version: 'v3.10.1', role: 'Data Visualization & Charts' },
  { name: 'Express', version: 'v4.21.0', role: 'Backend REST API' },
  { name: 'Mongoose', version: 'v8.7.0', role: 'MongoDB Object Modeling' },
];

const RELEASE_HIGHLIGHTS = [
  'Deterministic daily safe spending pace calculations based on remaining monthly days',
  'Cash runway and "Will My Money Last?" forecast model',
  'Explainable 5-factor Financial Health Score (0–100)',
  'Multi-category monthly budgets with 80% caution and 100% overspend alerts',
  'Savings goals with feasibility pacing and contribution records',
  'Algorithmic Smart Saving Plan identifying non-essential expense reductions',
  'Dynamic multi-currency engine (INR, USD, EUR, GBP, CAD, AUD, JPY)',
  'Obsidian Dark, Frosted Daylight, and System theme synchronization',
];

const AboutTab = () => {
  return (
    <div className="space-y-6">
      {/* Product Overview Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-dark-800">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-info-600 to-income-500 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg shadow-info-500/20 shrink-0">
                ₹
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight break-words">SmartExpense</h3>
                <p className="text-xs text-dark-400 mt-0.5">
                  Student Financial Intelligence & Expense Planning Platform
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="info">v1.0.0 Release Edition</Badge>
                  <Badge variant="success">All Systems Operational</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Statement */}
          <div className="pt-5">
            <h4 className="text-sm font-semibold text-white mb-1.5">Mission Statement</h4>
            <p className="text-xs sm:text-sm text-dark-300 leading-relaxed">
              SmartExpense is engineered to help college students and young scholars master their personal finances, prevent mid-month pocket money burnouts, and cultivate lifelong saving habits through transparent, explainable calculations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actual Tech Stack Card */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <FiCpu className="text-info-400 text-lg" />
              <CardTitle>Technology Architecture</CardTitle>
            </div>
            <CardDescription>
              Actual core dependencies and libraries powering this application.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TECH_STACK.map((tech) => (
              <div
                key={tech.name}
                className="p-3.5 rounded-2xl bg-dark-900 border border-dark-750 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{tech.name}</span>
                    <span className="text-[11px] font-semibold text-info-400 px-2 py-0.5 rounded-md bg-info-500/10 border border-info-500/20">
                      {tech.version}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1.5">{tech.role}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Release Highlights Card */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <FiLayers className="text-income-400 text-lg" />
              <CardTitle>Release Highlights</CardTitle>
            </div>
            <CardDescription>
              Key features delivered in the SmartExpense v1.0.0 Release.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RELEASE_HIGHLIGHTS.map((highlight, index) => (
              <div
                key={index}
                className="p-3 rounded-xl bg-dark-900/60 border border-dark-750 flex items-start gap-2.5"
              >
                <FiCheckCircle className="text-income-400 text-sm shrink-0 mt-0.5" />
                <span className="text-xs text-dark-300 leading-normal">{highlight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutTab;

import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-12 border-t border-dark-800/80 bg-dark-900/60 backdrop-blur-xl text-dark-400 select-none pb-20 lg:pb-8 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-dark-800/60">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-info-600 to-income-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-info-600/20">
                ₹
              </div>
              <span className="font-bold text-white text-base tracking-tight">SmartExpense</span>
            </div>
            <p className="text-xs text-dark-400 leading-relaxed">
              Intelligent budgeting, real-time safe spending limits, and automated savings planning built for college students.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-income-500/10 text-income-400 border border-income-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-income-400 animate-pulse" />
                Systems Operational
              </span>
              <span className="text-[11px] text-dark-500 font-medium">v1.0.0</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-200">Platform</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/transactions" className="hover:text-white transition-colors">
                  Transactions History
                </Link>
              </li>
              <li>
                <Link to="/budgets" className="hover:text-white transition-colors">
                  Monthly Budgets
                </Link>
              </li>
              <li>
                <Link to="/savings" className="hover:text-white transition-colors">
                  Savings Goals
                </Link>
              </li>
              <li>
                <Link to="/spending-pace" className="hover:text-white transition-colors">
                  Spending Pace & Runway
                </Link>
              </li>
              <li>
                <Link to="/saving-plan" className="hover:text-white transition-colors">
                  Smart Saving Planner
                </Link>
              </li>
            </ul>
          </div>

          {/* Settings & Preferences */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-200">Preferences</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/settings?tab=account" className="hover:text-white transition-colors">
                  My Account Baseline
                </Link>
              </li>
              <li>
                <Link to="/settings?tab=preferences" className="hover:text-white transition-colors">
                  Theme (Dark / Light / System)
                </Link>
              </li>
              <li>
                <Link to="/settings?tab=preferences" className="hover:text-white transition-colors">
                  Currency Setup
                </Link>
              </li>
              <li>
                <Link to="/settings?tab=categories" className="hover:text-white transition-colors">
                  Custom Categories
                </Link>
              </li>
              <li>
                <Link to="/settings?tab=account" className="hover:text-white transition-colors">
                  Account Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Legal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-200">Resources & Legal</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/settings?tab=help" className="hover:text-white transition-colors">
                  Help & FAQs
                </Link>
              </li>
              <li>
                <Link to="/settings?tab=contact" className="hover:text-white transition-colors">
                  Feedback & Support
                </Link>
              </li>
              <li>
                <Link to="/settings?tab=about" className="hover:text-white transition-colors">
                  About SmartExpense
                </Link>
              </li>
              <li>
                <Link to="/settings?tab=legal" className="hover:text-white transition-colors">
                  Data Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/settings?tab=legal" className="hover:text-white transition-colors">
                  Terms of Use & Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Advisory Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-dark-500">
          <p className="text-center sm:text-left">
            Advisory financial organization tool for students. Not certified investment or financial advice.
          </p>
          <p className="text-center sm:text-right flex items-center gap-1">
            <span>© 2026 SmartExpense. Crafted for student financial wellness.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

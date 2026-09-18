import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import {
  FiShield,
  FiFileText,
  FiLock,
  FiAlertTriangle,
  FiEyeOff,
  FiDatabase
} from 'react-icons/fi';

const PrivacyTermsTab = () => {
  return (
    <div className="space-y-6">
      {/* Privacy Policy Card */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <FiShield className="text-income-400 text-lg" />
              <CardTitle>Data Privacy Statement</CardTitle>
            </div>
            <CardDescription>
              Transparent disclosure of how your credentials, financial baseline, and entries are handled.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs sm:text-sm text-dark-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-dark-900 border border-dark-750 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-info-500/10 border border-info-500/20 flex items-center justify-center text-info-400 shrink-0 mt-0.5">
                <FiLock className="text-sm" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Password Security with bcrypt</h4>
                <p className="text-xs text-dark-400 mt-1">
                  Your password is cryptographically hashed using bcrypt with 12 salt rounds before being stored in the database. Plaintext passwords are never logged, stored, or readable by anyone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-dark-800">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <FiDatabase className="text-sm" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">JWT Session & User Ownership Isolation</h4>
                <p className="text-xs text-dark-400 mt-1">
                  Requests are authenticated via JSON Web Tokens (JWT). All transactions, budgets, categories, and goals are strictly isolated by your user ID in database queries. Users can only access their own records.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-dark-800">
              <div className="w-8 h-8 rounded-xl bg-income-500/10 border border-income-500/20 flex items-center justify-center text-income-400 shrink-0 mt-0.5">
                <FiEyeOff className="text-sm" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Zero Advertising Trackers & Zero Data Selling</h4>
                <p className="text-xs text-dark-400 mt-1">
                  SmartExpense does not embed third-party advertising trackers, marketing pixels, or analytics brokers. Your spending history and allowance figures are never sold or shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Disclaimer Card */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="text-warning-400 text-lg" />
              <CardTitle>Financial Guidance Disclaimer</CardTitle>
            </div>
            <CardDescription>
              Important notice regarding financial calculations and projections.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-2xl bg-warning-500/10 border border-warning-500/20 text-xs sm:text-sm text-dark-200 leading-relaxed space-y-2">
            <p className="font-semibold text-warning-300">
              SmartExpense is an informational financial organization tool.
            </p>
            <p className="text-dark-300">
              All metrics—including the Daily Safe Limit, "Will My Money Last?" projections, Financial Health Score, and Smart Saving Plan—are advisory mathematical estimates based entirely on user-entered transactions and baselines.
            </p>
            <p className="text-dark-300">
              They do not constitute certified professional financial, investment, legal, accounting, or tax advice. Always exercise personal discretion when making spending or saving decisions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Terms of Use Card */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <FiFileText className="text-info-400 text-lg" />
              <CardTitle>Terms of Use</CardTitle>
            </div>
            <CardDescription>
              Conditions for using this student personal finance application.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs sm:text-sm text-dark-300 leading-relaxed">
          <p>
            <strong className="text-white">1. Personal & Non-Commercial Use:</strong> SmartExpense is provided for personal student budgeting and educational purposes.
          </p>
          <p>
            <strong className="text-white">2. Account Responsibility:</strong> You are responsible for safeguarding your login credentials and maintaining the accuracy of your financial baseline figures.
          </p>
          <p>
            <strong className="text-white">3. System Availability:</strong> The software is provided on an "as-is" basis for academic and personal use without warranty of continuous uninterrupted availability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyTermsTab;

import React, { useState } from 'react';
import API from '../../../api/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import {
  FiSend,
  FiMessageSquare,
  FiCode,
  FiCheckCircle,
  FiInfo
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const ContactTab = () => {
  const [formData, setFormData] = useState({
    category: 'feedback',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (formData.message.trim().length < 10) {
      toast.error('Please provide a message with at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await API.post('/feedback', {
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      const newEntry = response.data?.data || {
        subject: formData.subject.trim(),
        category: formData.category,
      };

      setSubmittedFeedback(newEntry);
      setFormData({ category: 'feedback', subject: '', message: '' });
      toast.success('Your feedback has been submitted to the admin team!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit feedback. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback & Bug Report Card */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <FiMessageSquare className="text-info-400 text-lg" />
              <CardTitle>Feedback & Issue Reporting</CardTitle>
            </div>
            <CardDescription>
              Submit bug reports, feature suggestions, or general feedback about your experience with SmartExpense.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <Select
              label="Feedback Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="feedback">General Student Feedback</option>
              <option value="bug">Bug Report / Calculation Glitch</option>
              <option value="feature">Feature Suggestion</option>
              <option value="ui">Design & Usability Suggestion</option>
            </Select>

            <Input
              label="Subject"
              name="subject"
              type="text"
              placeholder="e.g. Daily safe limit on the 1st of month"
              value={formData.subject}
              onChange={handleChange}
              required
            />

            <div>
              <label className="label mb-1.5">Your Message / Report</label>
              <textarea
                name="message"
                rows={4}
                placeholder="Describe your suggestion or the steps to reproduce an issue..."
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-dark-600 text-dark-100 rounded-xl px-4 py-2.5 text-sm placeholder:text-dark-500 focus:border-info-500 focus:ring-1 focus:ring-info-500 transition-colors duration-200 outline-none resize-none"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-dark-900/60 border border-dark-750 flex items-start gap-2.5 text-xs text-dark-400">
              <FiInfo className="text-info-400 shrink-0 mt-0.5" />
              <span>
                Your feedback has been submitted and is available to the administration team.
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                icon={FiSend}
              >
                Submit Feedback
              </Button>
            </div>
          </form>

          {/* Feedback Success Notification */}
          {submittedFeedback && (
            <div className="mt-5 p-4 rounded-2xl bg-income-500/10 border border-income-500/20 flex items-start gap-3">
              <FiCheckCircle className="text-income-400 text-lg shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-white">Feedback Submitted Successfully</p>
                <p className="text-dark-300 mt-0.5">
                  Your feedback for "{submittedFeedback.subject}" has been received by the administration team.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project & Developer Context Card */}
      <Card>
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <FiCode className="text-income-400 text-lg" />
              <CardTitle>Project Information</CardTitle>
            </div>
            <CardDescription>
              SmartExpense Major Project repository details and maintainer context.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-2xl bg-dark-900 border border-dark-750">
            <h4 className="text-sm font-semibold text-white">Project Scope & Maintainer</h4>
            <p className="text-xs text-dark-400 mt-1 leading-relaxed">
              This application is developed as a comprehensive Student Expense Tracker & Smart Savings Planner Major Project. Built to solve real-world hostel budgeting challenges and promote student financial well-being.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700 text-dark-300">
                Workspace: expense-tracker
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700 text-dark-300">
                Edition: Full-Stack MERN
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactTab;

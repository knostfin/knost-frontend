import React, { useEffect } from 'react';

export default function LegalModal({ isOpen, onClose, type }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content =
    type === 'terms' ? (
      <div className="space-y-7 text-gray-300">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Terms and Conditions</h2>
          <p className="text-sm text-gray-400 mb-6">Effective Date: December 8, 2025</p>
        </div>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h3>
          <p className="leading-relaxed">
            By accessing and using Knost (&quot;the App&quot;), you accept and agree to be bound by
            these Terms and Conditions. If you do not agree to these terms, please do not use the
            App.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">2. Description of Service</h3>
          <p className="leading-relaxed mb-3">
            Knost is a personal expense tracking and financial management application designed to
            help users:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Track daily expenses and income</li>
            <li>Categorize and analyze spending patterns</li>
            <li>Set budgets and financial goals</li>
            <li>Generate financial reports and insights</li>
            <li>Manage multiple accounts and transactions</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">3. User Accounts</h3>
          <p className="leading-relaxed mb-3">
            To use Knost, you must create an account by providing accurate and complete information.
            You are responsible for:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
            <li>Ensuring your contact information remains current</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">4. User Responsibilities</h3>
          <p className="leading-relaxed mb-3">You agree to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Use the App only for lawful purposes</li>
            <li>Provide accurate financial information</li>
            <li>Not attempt to gain unauthorized access to any part of the App</li>
            <li>Not interfere with or disrupt the App&apos;s functionality</li>
            <li>Not use the App for any fraudulent or malicious activities</li>
            <li>Comply with all applicable local, state, and national laws</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">5. Data Accuracy</h3>
          <p className="leading-relaxed">
            While Knost provides tools to help you manage your finances, you are solely responsible
            for the accuracy of the data you enter. We do not verify the accuracy of your expense
            entries and are not liable for any financial decisions you make based on the information
            in the App.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">6. Intellectual Property</h3>
          <p className="leading-relaxed">
            All content, features, and functionality of Knost, including but not limited to text,
            graphics, logos, icons, images, and software, are the exclusive property of Knost and
            are protected by international copyright, trademark, and other intellectual property
            laws.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">7. Limitation of Liability</h3>
          <p className="leading-relaxed">
            Knost is provided &quot;as is&quot; without warranties of any kind. We are not liable
            for any direct, indirect, incidental, consequential, or punitive damages arising from
            your use of the App, including but not limited to financial losses, data loss, or
            service interruptions.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">8. Modifications to Service</h3>
          <p className="leading-relaxed">
            We reserve the right to modify, suspend, or discontinue any aspect of Knost at any time
            without prior notice. We are not liable to you or any third party for any modification,
            suspension, or discontinuation of the service.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">9. Termination</h3>
          <p className="leading-relaxed">
            We may terminate or suspend your account and access to Knost immediately, without prior
            notice, for any reason, including breach of these Terms. Upon termination, your right to
            use the App will cease immediately.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">10. Changes to Terms</h3>
          <p className="leading-relaxed">
            We reserve the right to update these Terms and Conditions at any time. We will notify
            users of significant changes via email or in-app notification. Continued use of the App
            after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">11. Contact Information</h3>
          <p className="leading-relaxed">
            For questions or concerns regarding these Terms and Conditions, please contact us at:
          </p>
          <div className="mt-3 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="font-medium">Email: support@knost.com</p>
            <p className="font-medium">Website: www.knost.com</p>
          </div>
        </section>
      </div>
    ) : (
      <div className="space-y-6 text-gray-300">
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Privacy Policy</h2>
          <p className="text-sm text-gray-400 mb-6">Effective Date: December 8, 2025</p>
        </div>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">1. Introduction</h3>
          <p className="leading-relaxed">
            At Knost, we are committed to protecting your privacy and ensuring the security of your
            personal and financial information. This Privacy Policy explains how we collect, use,
            store, and protect your data when you use our expense tracking application.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">2.1 Personal Information</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Full name (first and last name)</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Account credentials (encrypted password)</li>
                <li>Profile preferences and settings</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">2.2 Financial Information</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Expense and income transactions</li>
                <li>Budget allocations and financial goals</li>
                <li>Category classifications</li>
                <li>Payment methods (stored securely, not plain text)</li>
                <li>Account balances and summaries</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">2.3 Usage Data</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Device information (type, operating system)</li>
                <li>IP address and location data</li>
                <li>App usage patterns and features accessed</li>
                <li>Log files and error reports</li>
                <li>Session duration and frequency</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h3>
          <p className="leading-relaxed mb-3">We use your information to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide and maintain the expense tracking service</li>
            <li>Process your transactions and generate financial reports</li>
            <li>Send important updates, notifications, and alerts</li>
            <li>Improve app performance and user experience</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Detect and prevent fraud or unauthorized access</li>
            <li>Comply with legal obligations and enforce our Terms</li>
            <li>Conduct analytics to enhance our services</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">4. Data Security</h3>
          <p className="leading-relaxed mb-3">
            We implement industry-standard security measures to protect your data:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>End-to-end encryption for sensitive financial data</li>
            <li>Secure Socket Layer (SSL/TLS) for data transmission</li>
            <li>Password hashing using bcrypt or similar algorithms</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Multi-factor authentication options</li>
            <li>Restricted employee access to user data</li>
            <li>Secure cloud storage with backup redundancy</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">5. Data Sharing and Disclosure</h3>
          <p className="leading-relaxed mb-3">
            We do not sell your personal information. We may share your data only in the following
            circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>
              <strong>Service Providers:</strong> Third-party vendors who assist in app operation
              (hosting, analytics, email services)
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law, court order, or
              governmental regulation
            </li>
            <li>
              <strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset
              sale
            </li>
            <li>
              <strong>Your Consent:</strong> When you explicitly authorize us to share information
            </li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">6. Data Retention</h3>
          <p className="leading-relaxed">
            We retain your personal and financial data for as long as your account is active or as
            needed to provide services. You may request deletion of your data at any time, subject
            to legal and regulatory retention requirements. Deleted data is permanently removed from
            our systems within 30 days.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">7. Your Rights</h3>
          <p className="leading-relaxed mb-3">You have the right to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Access and review your personal data</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your account and data</li>
            <li>Export your data in a portable format</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent for data processing (where applicable)</li>
            <li>Lodge a complaint with a data protection authority</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">8. Cookies and Tracking</h3>
          <p className="leading-relaxed">
            Knost uses cookies and similar tracking technologies to enhance user experience,
            remember preferences, and analyze app usage. You can control cookie settings through
            your browser, but disabling cookies may limit certain app functionalities.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">9. Third-Party Services</h3>
          <p className="leading-relaxed">
            Our app may contain links to third-party services or integrations. We are not
            responsible for the privacy practices of these external services. We encourage you to
            review their privacy policies before providing any personal information.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">10. Children&apos;s Privacy</h3>
          <p className="leading-relaxed">
            Knost is not intended for users under the age of 18. We do not knowingly collect
            personal information from children. If we become aware that a child has provided us with
            personal data, we will take steps to delete such information immediately.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">11. Changes to Privacy Policy</h3>
          <p className="leading-relaxed">
            We may update this Privacy Policy periodically to reflect changes in our practices or
            legal requirements. We will notify you of significant changes via email or in-app
            notification. Your continued use of Knost after such changes constitutes acceptance of
            the updated policy.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-white mb-3">12. Contact Us</h3>
          <p className="leading-relaxed mb-3">
            If you have questions, concerns, or requests regarding this Privacy Policy or your
            personal data, please contact us:
          </p>
          <div className="mt-3 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="font-medium">Email: privacy@knost.com</p>
            <p className="font-medium">Data Protection Officer: dpo@knost.com</p>
            <p className="font-medium">Website: www.knost.com/privacy</p>
          </div>
        </section>

        <section className="pt-4 border-t border-white/10">
          <p className="text-sm text-gray-400 italic">
            By using Knost, you acknowledge that you have read, understood, and agree to this
            Privacy Policy.
          </p>
        </section>
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-gradient-to-br from-[#0f1318] to-[#1a1f2e] border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-gradient-to-b from-[#0f1318] to-transparent border-b border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">
              {type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[calc(90vh-130px)] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent pb-20">
          {content}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-8 py-4 bg-gradient-to-t from-[#0f1318] to-transparent border-t border-white/10 backdrop-blur-xl">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

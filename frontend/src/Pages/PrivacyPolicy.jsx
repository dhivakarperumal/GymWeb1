import React from "react";
import PageContainer from "../Components/PageContainer";

const PrivacyPolicy = () => {
  return (
    <section className="min-h-screen bg-black text-white py-16">
      <PageContainer className="space-y-10">
        <div className="max-w-4xl mx-auto">
          <p className="text-red-500 uppercase tracking-[0.35em] text-sm font-semibold mb-4">
            DAP Fitness Studio
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Privacy Policy
          </h1>
          <p className="text-white/70 leading-relaxed text-lg">
            At DAP Fitness Studio, we respect your privacy and are committed to protecting the personal information you entrust to us. This policy explains how we collect, use, store, disclose, and safeguard your personal data when you interact with our studio, services, and digital platforms.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-10 text-white/75 text-[15px] leading-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Corporate Privacy</h2>
            <p>
              DAP Fitness Studio and its authorized staff take the confidentiality of your personal data seriously. We will collect, store, transmit, and use personal information only for legitimate membership, training, and operational purposes, and only when necessary to provide the services you request.
            </p>
            <p>
              When you ask us to review or update your personal information, we will provide or correct it in a timely and appropriate manner.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Collection and Use of Personal Data</h2>
            <p>
              We may collect personal information such as your name, contact details, emergency contact, health information, membership and payment details, and any other information needed to deliver fitness services safely and effectively.
            </p>
            <p>
              We use this information to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-5">
              <li>manage memberships, bookings, and payments;</li>
              <li>provide training plans, fitness assessments, and customer support;</li>
              <li>maintain a safe training environment;</li>
              <li>communicate important updates and offers;</li>
              <li>comply with legal, contractual, and regulatory requirements.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Accuracy of Personal Data</h2>
            <p>
              We strive to keep your personal data accurate and up to date. When possible, we validate information using accepted standards and may ask for supporting documentation for proof of identity or address. Please notify us if any of your information changes so we can maintain accurate records.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Storage and Retention of Personal Data</h2>
            <p>
              Personal data is stored securely in electronic systems and in locked physical files where applicable. Access is restricted to authorized personnel only. We retain your personal data only for as long as is necessary to fulfill the original purpose or directly related purposes, unless retention is required by law or contract.
            </p>
            <p>
              When personal data is no longer needed, we will dispose of it in a secure manner consistent with our internal retention policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Disclosure of Personal Data</h2>
            <p>
              We keep your personal data confidential, but we may share it with third parties only when required to support the services you requested or where permitted by law. Examples include:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-5">
              <li>our affiliates, business partners, and service providers;</li>
              <li>payment processors, financial institutions, and collections partners;</li>
              <li>any party acting on our behalf under a duty of confidentiality;</li>
              <li>authorities or courts when required by applicable law or legal process.</li>
            </ul>
            <p>
              We will only disclose personal data to parties that have a legitimate need and have agreed to protect it appropriately.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Transfer of Personal Data Outside India</h2>
            <p>
              In some cases, personal information may be transferred to locations outside India to support the services we provide. Such transfers are carried out in accordance with applicable laws and our internal policies to maintain appropriate protections for your data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Security of Personal Data</h2>
            <p>
              We use physical, technical, and administrative safeguards to protect personal data from unauthorised access and misuse. Access is granted only on a need-to-know basis, and systems are monitored to detect and investigate suspicious activity.
            </p>
            <p>
              While we work hard to secure your data, no internet transmission can be guaranteed fully secure. We cannot accept liability for unauthorized access that is outside our reasonable control.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Access and Correction of Personal Data</h2>
            <p>
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-5">
              <li>check whether we hold your personal data and obtain copies of it;</li>
              <li>request correction of any personal data that is inaccurate for the purposes for which it is used.</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the details below.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Changes to this Policy</h2>
            <p>
              DAP Fitness Studio may update this policy from time to time to reflect changes in our practices or legal requirements. We encourage you to review this page periodically for the latest information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-500">Contact Us</h2>
            <p>
              If you have questions or requests regarding your personal data, please get in touch with us at:
            </p>
            <div className="space-y-2 text-white/80">
              <p>DAP Fitness Studio</p>
              <p>No 9, 2nd Floor, Rajiv Gandhi Salai, next to Accenture Company,</p>
              <p>OMR, Sholinganallur, Chennai 600119</p>
              <p>Email: dapfitnessstudio@gmail.com</p>
              <p>Phone: +91 81898 21029</p>
            </div>
          </section>
        </div>
      </PageContainer>
    </section>
  );
};

export default PrivacyPolicy;

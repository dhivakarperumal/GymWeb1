import React, { useState } from 'react';
import api from '../../api';

const InformedConsent = ({ onNext, onPrevious, formData, isFirstStep, isLastStep }) => {
  const [consentData, setConsentData] = useState({
    understand_risks: formData?.understand_risks || false,
    voluntary_participation: formData?.voluntary_participation || false,
    medical_clearance: formData?.medical_clearance || false,
    emergency_contact_verified: formData?.emergency_contact_verified || false,
    photo_consent: formData?.photo_consent || false,
    data_privacy_consent: formData?.data_privacy_consent || false,
    signature: formData?.signature || "",
    signature_date: formData?.signature_date || "",
    witness_signature: formData?.witness_signature || "",
    witness_date: formData?.witness_date || ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required consents
    const requiredConsents = [
      'understand_risks',
      'voluntary_participation',
      'medical_clearance',
      'emergency_contact_verified',
      'data_privacy_consent'
    ];

    const missingConsents = requiredConsents.filter(consent => !consentData[consent]);

    if (missingConsents.length > 0) {
      alert(`Please provide consent for: ${missingConsents.join(', ')}`);
      return;
    }

    if (!consentData.signature) {
      alert('Please provide your signature');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine all form data
      const completeFormData = {
        ...formData,
        ...consentData,
        registration_date: new Date().toISOString(),
        status: 'completed'
      };

      // Submit the complete registration
      await api.post('/pt-registrations', completeFormData);

      alert('PT Registration completed successfully!');
      onNext(consentData);
    } catch (error) {
      console.error('Error completing registration:', error);
      alert('Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConsentData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-orange-500 font-bold border-b border-white/10 pb-1 uppercase tracking-wider text-sm">Please read and agree to the following terms</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Risk Acknowledgment */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <h4 className="text-orange-400 font-bold mb-2">Risk Acknowledgment</h4>
          <p className="text-white/80 text-sm mb-3">
            I understand that physical exercise and training carry inherent risks including, but not limited to,
            muscle strains, sprains, fractures, and other injuries. I acknowledge that results are not guaranteed
            and depend on various factors including my commitment and adherence to the program.
          </p>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="understand_risks"
              checked={consentData.understand_risks}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-white/80 text-sm">I understand and accept these risks</span>
          </label>
        </div>

        {/* Voluntary Participation */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <h4 className="text-orange-400 font-bold mb-2">Voluntary Participation</h4>
          <p className="text-white/80 text-sm mb-3">
            My participation in this personal training program is completely voluntary. I understand that I may
            withdraw from the program at any time without penalty.
          </p>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="voluntary_participation"
              checked={consentData.voluntary_participation}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-white/80 text-sm">I voluntarily agree to participate</span>
          </label>
        </div>

        {/* Medical Clearance */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <h4 className="text-orange-400 font-bold mb-2">Medical Clearance</h4>
          <p className="text-white/80 text-sm mb-3">
            I certify that I have provided accurate health information and have not withheld any medical
            conditions that could affect my participation in exercise. I understand the importance of
            consulting with a physician before beginning any exercise program.
          </p>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="medical_clearance"
              checked={consentData.medical_clearance}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-white/80 text-sm">I have provided accurate medical information</span>
          </label>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <h4 className="text-orange-400 font-bold mb-2">Emergency Contact Verification</h4>
          <p className="text-white/80 text-sm mb-3">
            I confirm that the emergency contact information provided is current and accurate.
            In case of emergency, I authorize the trainer to contact these individuals.
          </p>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="emergency_contact_verified"
              checked={consentData.emergency_contact_verified}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-white/80 text-sm">Emergency contact information is verified</span>
          </label>
        </div>

        {/* Photo/Video Consent */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <h4 className="text-orange-400 font-bold mb-2">Photo/Video Consent (Optional)</h4>
          <p className="text-white/80 text-sm mb-3">
            I grant permission for photographs or videos to be taken of me during training sessions
            for progress tracking and educational purposes only.
          </p>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="photo_consent"
              checked={consentData.photo_consent}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-white/80 text-sm">I consent to photos/videos for progress tracking</span>
          </label>
        </div>

        {/* Data Privacy */}
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <h4 className="text-orange-400 font-bold mb-2">Data Privacy Consent</h4>
          <p className="text-white/80 text-sm mb-3">
            I consent to the collection, storage, and processing of my personal and health information
            for the purposes of providing personal training services. This information will be kept
            confidential and secure in accordance with applicable privacy laws.
          </p>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="data_privacy_consent"
              checked={consentData.data_privacy_consent}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-white/80 text-sm">I consent to data collection and processing</span>
          </label>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Participant Signature
            </label>
            <input
              type="text"
              name="signature"
              value={consentData.signature}
              onChange={handleChange}
              placeholder="Type your full name as signature"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="date"
              name="signature_date"
              value={consentData.signature_date}
              onChange={handleChange}
              className="w-full mt-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Witness Signature (Optional)
            </label>
            <input
              type="text"
              name="witness_signature"
              value={consentData.witness_signature}
              onChange={handleChange}
              placeholder="Witness full name"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              name="witness_date"
              value={consentData.witness_date}
              onChange={handleChange}
              className="w-full mt-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirstStep}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
              isFirstStep
                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            Previous
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg hover:shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InformedConsent;
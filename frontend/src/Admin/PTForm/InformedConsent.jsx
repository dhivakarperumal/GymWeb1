import React, { useState } from "react";

const InformedConsent = ({ onNext, onPrevious, isFirstStep }) => {
  const [form, setForm] = useState({
    participant_name: "",
    agree: false,
    signature: "",
    date: "",
    guardian_signature: "",
    witness: "",
  });

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(form);
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl text-white">

        <h3 className="text-orange-500 font-bold border-b border-white/10 pb-2 uppercase tracking-wider">
          Informed Consent Form
        </h3>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Consent Intro */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="uppercase text-sm text-orange-400 font-semibold mb-5">
              Please Fill In All Information Requested Below
            </p>

            <div className="flex flex-wrap items-center gap-3 leading-8">
              <span>I</span>

              <input
                type="text"
                name="participant_name"
                value={form.participant_name}
                onChange={handleChange}
                placeholder="Full Name"
                className="bg-transparent border-b border-orange-400 px-2 outline-none"
              />

              <span>
                give my consent to participate in the physical fitness evaluation
                program conducted by DAP Unisex Fitness Studio.
              </span>
            </div>

            <label className="flex items-center gap-3 mt-6">
              <input
                type="checkbox"
                name="agree"
                checked={form.agree}
                onChange={handleChange}
              />
              <span>I Agree</span>
            </label>
          </div>

          {/* Benefits */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-orange-400 font-bold text-lg mb-4">
              BENEFITS
            </h3>

            <p className="text-white/80 leading-8">
              Participation in a regular program of physical activity has been
              shown to produce positive changes in a number of organ systems.
              These changes include increased work capacity, improved
              cardiovascular efficiency, and increased muscular strength,
              flexibility power and endurance.
            </p>
          </div>

          {/* Risks */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-orange-400 font-bold text-lg mb-4">
              RISKS
            </h3>

            <p className="text-white/80 leading-8">
              I recognize that exercise carries some risk to the musculoskeletal
              system (sprains, strains) and the cardiorespiratory system
              (dizziness, discomfort in breathing, heart attack). I hereby certify
              that I know of no medical problem that would increase my risk of
              illness and injury as a result of participation in a regular
              exercise program.
            </p>
          </div>

          {/* Testing */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-orange-400 font-bold text-lg mb-4">
              TESTING AND EVALUATION RESULTS
            </h3>

            <p className="text-white/80 leading-8 mb-5">
              I understand that I will undergo initial testing to determine my
              current physical fitness status. Testing will consist of health
              inventory, assessing body composition, treadmill testing,
              muscular fitness and flexibility screening.
            </p>

            <p className="text-white/80 leading-8 mb-5">
              I understand my individual results will be made available only to
              me and are not intended to replace any medical test or physician
              services.
            </p>

            <p className="text-white/80 leading-8">
              By signing this consent form, I understand I am personally
              responsible for my actions during my tenure at DAP Unisex Fitness
              Studio.
            </p>
          </div>

          {/* Policy */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 text-orange-300 font-semibold">
            * No Refund • No Transfer • No Extension • No Freezing
          </div>

          {/* Signatures */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-orange-300">
                Signature
              </label>
              <input
                name="signature"
                value={form.signature}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
                placeholder="Type signature"
              />
            </div>

            <div>
              <label className="block mb-2 text-orange-300">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-orange-300">
              Parent/Guardian Signature (if minor)
            </label>
            <input
              name="guardian_signature"
              value={form.guardian_signature}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block mb-2 text-orange-300">
              Witness
            </label>
            <input
              name="witness"
              value={form.witness}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onPrevious}
              disabled={isFirstStep}
              className="flex-1 py-3 bg-gray-700 rounded-lg hover:bg-gray-600"
            >
              Previous
            </button>

            <button
              type="submit"
              className="flex-1 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 font-bold"
            >
              Complete Registration
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default InformedConsent;
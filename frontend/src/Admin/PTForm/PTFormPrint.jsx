import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';
import dayjs from 'dayjs';
import { Printer, ChevronLeft } from 'lucide-react';

const PTFormPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [ptForm, setPtForm] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const hideControls = searchParams.get('hideControls') === 'true';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memRes, ptRes] = await Promise.all([
          api.get(`/members/${id}`),
          api.get(`/pt-forms/${id}`)
        ]);
        setMember(memRes.data);
        const data = ptRes.data.form_data;
        setPtForm(typeof data === 'string' ? JSON.parse(data) : data);
      } catch (err) {
        console.error("Failed to fetch data for printing", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const handleAfterPrint = () => {
      navigate('/admin/members');
    };

    window.addEventListener('afterprint', handleAfterPrint);

    if (!loading && member && ptForm && !hideControls) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
    }

    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [loading, member, ptForm, navigate, hideControls]);

  if (loading) return <div className="p-20 text-center">Loading form details...</div>;
  if (!member || !ptForm) return <div className="p-20 text-center">Form not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen bg-white text-black font-serif ${hideControls ? 'p-0' : 'p-4 sm:p-10'}`}>
      {/* Control Panel - Hidden when printing or in modal */}
      {!hideControls && (
        <div className="fixed top-4 right-4 flex gap-3 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition"
          >
            <ChevronLeft size={18} /> Back
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg transition"
          >
            <Printer size={18} /> Print Now
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto border-2 border-black p-8">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-3xl font-bold uppercase tracking-widest">DAP Unisex Fitness Studio</h1>
          <p className="text-sm mt-1">Personal Training Registration & Assessment Form</p>
          <div className="mt-4 flex justify-between text-xs font-bold uppercase">
            <span>Member ID: {member.member_id || member.id}</span>
            <span>Date: {dayjs(member.pt_form_completed_at || new Date()).format('DD/MM/YYYY')}</span>
          </div>
        </div>

        {/* Section 1: Personal Details */}
        <div className="mb-6">
          <h2 className="text-xl font-bold bg-gray-100 p-2 mb-4 border border-black uppercase">1. Personal Information</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="border-b border-gray-300 pb-1"><span className="font-bold">Full Name:</span> {ptForm.name || member.name}</div>
            <div className="border-b border-gray-300 pb-1"><span className="font-bold">Gender:</span> {ptForm.gender || member.gender}</div>
            <div className="border-b border-gray-300 pb-1"><span className="font-bold">Phone:</span> {ptForm.phone || member.phone}</div>
            <div className="border-b border-gray-300 pb-1"><span className="font-bold">Email:</span> {ptForm.email || member.email}</div>
            <div className="border-b border-gray-300 pb-1"><span className="font-bold">DOB:</span> {ptForm.dob} ({ptForm.age} yrs)</div>
            <div className="border-b border-gray-300 pb-1"><span className="font-bold">Blood Group:</span> {ptForm.blood_group}</div>
            <div className="col-span-2 border-b border-gray-300 pb-1"><span className="font-bold">Address:</span> {ptForm.address}</div>
            <div className="border-b border-gray-300 pb-1"><span className="font-bold">Occupation:</span> {ptForm.occupation}</div>
            <div className="border-b border-gray-300 pb-1"><span className="font-bold">Fitness Goal:</span> {ptForm.fitness_goal}</div>
          </div>
        </div>

        {/* Section 2: Health History */}
        <div className="mb-6">
          <h2 className="text-xl font-bold bg-gray-100 p-2 mb-4 border border-black uppercase">2. Health History</h2>
          <div className="text-sm space-y-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <p><span className="font-bold">Meds:</span> {ptForm.medications}</p>
              <p><span className="font-bold">Allergies:</span> {ptForm.allergies || "None"}</p>
              <p className="col-span-2"><span className="font-bold">Surgeries:</span> {ptForm.surgeries1} {ptForm.surgeries2} {ptForm.surgeries3}</p>
              <p><span className="font-bold">Smoking/Alc:</span> {ptForm.smoking} / {ptForm.alcohol}</p>
              <p><span className="font-bold">Food:</span> {ptForm.food_preference}</p>
              <p><span className="font-bold">Exercise Prgm:</span> {ptForm.exercise_program}</p>
              <p><span className="font-bold">Supplements:</span> {ptForm.supplements}</p>
            </div>

            {ptForm.medications === "Yes" && (
              <table className="w-full border-collapse border border-black mt-2 text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-black p-1">Medicine Name</th>
                    <th className="border border-black p-1">Dosage</th>
                    <th className="border border-black p-1">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map(i => ptForm[`med${i}`] && (
                    <tr key={i}>
                      <td className="border border-black p-1">{ptForm[`med${i}`]}</td>
                      <td className="border border-black p-1">{ptForm[`dose${i}`]}</td>
                      <td className="border border-black p-1">{ptForm[`reason${i}`]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4">
              <p className="font-bold mb-2 underline">Health Questionnaire:</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
                {[
                  "Heart Attack", "Cardiac Surgery", "Chest Discomfort", "Palpitation", "Epilepsy",
                  "Fainting/Dizziness", "Hypertension", "Family History (Heart)", "Rheumatic Fever",
                  "Shortness of Breath", "Asthma/Wheezing", "High Cholesterol", "Diabetes", "Stroke",
                  "Recent Hospitalization", "Orthopedic Problem"
                ].map((q, i) => (
                  <div key={i} className="flex justify-between border-b border-gray-200">
                    <span>{i + 1}. {q}</span>
                    <span className="font-bold">{ptForm[`q${i}`] || "No"}</span>
                  </div>
                ))}
              </div>
            </div>

            <p><span className="font-bold">Recreational Sports:</span> {[1, 2, 3, 4, 5, 6].map(i => ptForm[`sport${i}`]).filter(Boolean).join(", ") || "None"}</p>
          </div>
        </div>

        {/* Section 3: Clinical Parameters */}
        <div className="mb-6">
          <h2 className="text-xl font-bold bg-gray-100 p-2 mb-4 border border-black uppercase">3. Clinical & Fitness Screening</h2>
          <div className="grid grid-cols-4 gap-4 text-sm text-center">
            <div className="border border-black p-2"><div className="font-bold">BP</div>{ptForm.bp}</div>
            <div className="border border-black p-2"><div className="font-bold">Sugar</div>{ptForm.sugar}</div>
            <div className="border border-black p-2"><div className="font-bold">Cholesterol</div>{ptForm.cholesterol}</div>
            <div className="border border-black p-2"><div className="font-bold">Thyroid</div>{ptForm.thyroid}</div>
            <div className="border border-black p-2"><div className="font-bold">Uric Acid</div>{ptForm.uric}</div>
            <div className="border border-black p-2"><div className="font-bold">Serum 3D</div>{ptForm.serum3d}</div>
            <div className="border border-black p-2"><div className="font-bold">Height</div>{ptForm.fs_height} cm</div>
            <div className="border border-black p-2"><div className="font-bold">Weight</div>{ptForm.fs_weight} kg</div>
            <div className="border border-black p-2"><div className="font-bold">Fat%</div>{ptForm.fs_fat_percentage}%</div>
            <div className="border border-black p-2"><div className="font-bold">BMI</div>{member.bmi}</div>
          </div>
          <div className="mt-4 text-sm grid grid-cols-3 gap-4">
            <p><span className="font-bold">Push-ups:</span> {ptForm.fs_push_ups_count} ({ptForm.fs_push_ups_level})</p>
            <p><span className="font-bold">Squats:</span> {ptForm.fs_squats_count} ({ptForm.fs_squats_level})</p>
            <p><span className="font-bold">Plank:</span> {ptForm.fs_plank_hold_count} ({ptForm.fs_plank_hold_level})</p>
          </div>
        </div>

        {/* Section 4: Measurements Table */}
        <div className="mb-6">
          <h2 className="text-xl font-bold bg-gray-100 p-2 mb-4 border border-black uppercase">4. Biometric Measurements</h2>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1">Measurement</th>
                {[1, 2, 3, 4, 5].map(i => <th key={i} className="border border-black p-1">Reading {i}</th>)}
              </tr>
            </thead>
            <tbody>
              {['Neck', 'Shoulder', 'Arm', 'Chest (Normal)', 'Chest (Expanded)', 'Waist', 'Abdomen', 'Hip', 'Thigh', 'Calf'].map(label => {
                const key = label.toLowerCase().replace(' (normal)', '_normal').replace(' (expanded)', '_expanded');
                return (
                  <tr key={label}>
                    <td className="border border-black p-1 font-bold">{label}</td>
                    {[0, 1, 2, 3, 4].map(col => (
                      <td key={col} className="border border-black p-1 text-center">
                        {ptForm.measurements?.[col]?.[key] || ptForm.measurements?.[col]?.[label.toLowerCase()] || ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Section 5: Session Tracker (User's requested part) */}
        <div className="mb-6 page-break-before">
          <h2 className="text-xl font-bold bg-gray-100 p-2 mb-4 border border-black uppercase text-center">Session Tracker</h2>
          <table className="w-full border-collapse border border-black text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 w-12">S.No.</th>
                <th className="border border-black p-2 w-24">Date</th>
                <th className="border border-black p-2">Workout</th>
                <th className="border border-black p-2 w-20">Status</th>
                <th className="border border-black p-2 w-28">Client sign</th>
                <th className="border border-black p-2 w-28">Trainer sign</th>
              </tr>
            </thead>
            <tbody>
              {(ptForm.sessions || Array(25).fill({})).map((session, i) => (
                <tr key={i} className="h-8">
                  <td className="border border-black p-1 text-center font-bold bg-gray-50">{i + 1}</td>
                  <td className="border border-black p-1 text-center">{session.date ? dayjs(session.date).format('DD/MM/YYYY') : ""}</td>
                  <td className="border border-black p-1">{session.workout || ""}</td>
                  <td className="border border-black p-1 text-center text-[8px] font-bold uppercase">{session.status || "Pending"}</td>
                  <td className="border border-black p-1 text-center">{session.client_sign || ""}</td>
                  <td className="border border-black p-1 text-center">{session.trainer_sign || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] font-bold text-center mt-2 uppercase tracking-widest">DAP Fitness Studio</p>
        </div>

        {/* Section 6: Consent */}
        <div className="mt-12 pt-8 border-t-2 border-black page-break-before">
          <h2 className="text-xl font-bold mb-4 uppercase text-center">Informed Consent & Declaration</h2>
          <p className="text-xs leading-relaxed italic">
            I, <span className="font-bold underline">{ptForm.participant_name}</span>, have given my consent to participate in the physical fitness evaluation program. I recognize that exercise carries some risk and I certify that I know of no medical problem that would increase my risk.
          </p>
          <div className="grid grid-cols-2 gap-20 mt-16 text-sm">
            <div className="text-center border-t border-black pt-2">
              <p className="font-bold italic">{ptForm.signature}</p>
              <p className="uppercase">Participant Signature</p>
            </div>
            <div className="text-center border-t border-black pt-2">
              <p className="font-bold">{dayjs(ptForm.date).format('DD/MM/YYYY')}</p>
              <p className="uppercase">Date</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-[10px] text-center text-gray-500 italic">
          * No Refund • No Transfer • No Extension • No Freezing
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything except the printable form */
          nav, aside, header, footer, .print-hidden, 
          .admin-root sidebar, .admin-root header, .admin-root footer,
          .glass-footer, .fixed, .fixed-top, .fixed-bottom,
          button, .ChevronLeft, .Printer { 
            display: none !important; 
          }

          /* Reset layouts and colors */
          html, body, #root, .min-h-screen, section, main, .admin-root, .flex-1 { 
            background: white !important; 
            color: black !important; 
            margin: 0 !important; 
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            position: static !important;
            overflow: visible !important;
            display: block !important;
          }

          .lg\\:ml-64, .lg\\:ml-20, .ml-0, .ml-64, .p-4, .p-6, .sm\\:p-5, .lg\\:p-6 {
            margin-left: 0 !important;
            padding: 0 !important;
          }

          .glass-container {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .max-w-4xl { 
            max-width: 100% !important; 
            width: 100% !important;
            border: none !important; 
            padding: 0 !important;
            margin: 0 !important;
          }

          @page { 
            margin: 1cm; 
            size: auto;
          }

          /* Force text to black for better contrast */
          * {
            color: black !important;
            background: transparent !important;
            -webkit-print-color-adjust: exact;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          .bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
        }
      `}} />
    </div>
  );
};

export default PTFormPrint;

import React, { useEffect, useState } from 'react';
import api from '../../api';
import dayjs from 'dayjs';

const PTFormPreviewContent = ({ memberId }) => {
  const [member, setMember] = useState(null);
  const [ptForm, setPtForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!memberId) return;
      try {
        setLoading(true);
        const [memRes, ptRes] = await Promise.all([
          api.get(`/members/${memberId}`),
          api.get(`/pt-forms/${memberId}`)
        ]);
        setMember(memRes.data);
        const data = ptRes.data.form_data;
        setPtForm(typeof data === 'string' ? JSON.parse(data) : data);
      } catch (err) {
        console.error("Failed to fetch data for preview", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [memberId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-gray-400 text-xs animate-pulse font-bold uppercase">Fetching Assessment Data...</p>
    </div>
  );

  if (!member || !ptForm) return (
    <div className="p-20 text-center text-gray-500">
      <p className="font-bold">PT Form data not found for this member.</p>
    </div>
  );

  return (
    <div className="bg-white text-black font-serif p-8 max-w-4xl mx-auto shadow-inner">
      <div className="border-2 border-black p-6">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold uppercase tracking-widest">DAP Unisex Fitness Studio</h1>
          <p className="text-xs mt-1">Personal Training Registration & Assessment Form</p>
          <div className="mt-4 flex justify-between text-[10px] font-bold uppercase">
            <span>Member ID: {member.member_id || member.id}</span>
            <span>Date: {dayjs(member.pt_form_completed_at || new Date()).format('DD/MM/YYYY')}</span>
          </div>
        </div>

        {/* Section 1: Personal Details */}
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-100 p-1 mb-2 border border-black uppercase text-sm">1. Personal Information</h2>
          <div className="grid grid-cols-2 gap-y-2 text-[11px]">
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
          <h2 className="text-lg font-bold bg-gray-100 p-1 mb-2 border border-black uppercase text-sm">2. Health History</h2>
          <div className="text-[11px] space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <p><span className="font-bold">Meds:</span> {ptForm.medications}</p>
              <p><span className="font-bold">Allergies:</span> {ptForm.allergies || "None"}</p>
              <p className="col-span-2"><span className="font-bold">Surgeries:</span> {ptForm.surgeries1} {ptForm.surgeries2} {ptForm.surgeries3}</p>
              <p><span className="font-bold">Smoking/Alc:</span> {ptForm.smoking} / {ptForm.alcohol}</p>
              <p><span className="font-bold">Food:</span> {ptForm.food_preference}</p>
              <p><span className="font-bold">Exercise Prgm:</span> {ptForm.exercise_program}</p>
              <p><span className="font-bold">Supplements:</span> {ptForm.supplements}</p>
            </div>
          </div>
        </div>

        {/* Section 3: Clinical Parameters */}
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-100 p-1 mb-2 border border-black uppercase text-sm">3. Clinical & Fitness Screening</h2>
          <div className="grid grid-cols-5 gap-2 text-[10px] text-center">
            <div className="border border-black p-1"><div className="font-bold">BP</div>{ptForm.bp}</div>
            <div className="border border-black p-1"><div className="font-bold">Sugar</div>{ptForm.sugar}</div>
            <div className="border border-black p-1"><div className="font-bold">Chol</div>{ptForm.cholesterol}</div>
            <div className="border border-black p-1"><div className="font-bold">Height</div>{ptForm.fs_height}</div>
            <div className="border border-black p-1"><div className="font-bold">Weight</div>{ptForm.fs_weight}</div>
          </div>
          <div className="mt-3 text-[10px] grid grid-cols-3 gap-2">
            <p><span className="font-bold">Push-ups:</span> {ptForm.fs_push_ups_count} ({ptForm.fs_push_ups_level})</p>
            <p><span className="font-bold">Squats:</span> {ptForm.fs_squats_count} ({ptForm.fs_squats_level})</p>
            <p><span className="font-bold">Plank:</span> {ptForm.fs_plank_hold_count} ({ptForm.fs_plank_hold_level})</p>
          </div>
        </div>

        {/* Section 4: Session Tracker */}
        <div className="mb-6">
          <h2 className="text-lg font-bold bg-gray-100 p-1 mb-2 border border-black uppercase text-center text-sm">Session Tracker</h2>
          <table className="w-full border-collapse border border-black text-[8px]">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <th className="border border-black p-1 w-10 text-center">S.No</th>
                <th className="border border-black p-1 w-20 text-center">Date</th>
                <th className="border border-black p-1">Workout</th>
                <th className="border border-black p-1 w-16 text-center">Status</th>
                <th className="border border-black p-1 w-24 text-center">Client</th>
                <th className="border border-black p-1 w-24 text-center">Trainer</th>
              </tr>
            </thead>
            <tbody>
              {(ptForm.sessions || Array(10).fill({})).slice(0, 15).map((session, i) => (
                <tr key={i} className="h-6">
                  <td className="border border-black p-1 text-center bg-gray-50 font-bold">{i + 1}</td>
                  <td className="border border-black p-1 text-center">{session.date ? dayjs(session.date).format('DD/MM/YYYY') : ""}</td>
                  <td className="border border-black p-1">{session.workout || ""}</td>
                  <td className="border border-black p-1 text-center text-[7px] font-bold uppercase">{session.status || "Pending"}</td>
                  <td className="border border-black p-1 text-center italic">{session.client_sign || ""}</td>
                  <td className="border border-black p-1 text-center font-bold">{session.trainer_sign || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Branding */}
        <p className="text-[10px] font-bold text-center uppercase tracking-widest border-t border-black pt-2 mt-4">
          DAP Fitness Studio - Personal Training Division
        </p>
      </div>
    </div>
  );
};

export default PTFormPreviewContent;

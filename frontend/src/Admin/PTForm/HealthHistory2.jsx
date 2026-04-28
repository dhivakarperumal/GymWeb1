import React, { useState } from "react";

const questions = [
    "Heart Attack",
    "Heart bypass or any other cardiac surgery",
    "Chest discomfort with Digine",
    "Palpitation",
    "Epilepsy",
    "Fainting or dizziness or loss of consciousness",
    "Hypertension (High blood pressure)",
    "Family history of heart disease (Male < 55 yrs & Female < 65 yrs)",
    "Rheumatic fever",
    "Shortness of breath with or without exercise",
    "Any Breathing differences / Wheezing / Asthma",
    "High blood cholesterol (lipid)",
    "Diabetes or impaired blood sugar",
    "Stroke",
    "Recent hospitalization / other medical conditions",
    "Orthopedic problem (including arthritis)"
];

const HealthHistory2 = ({ onNext, onPrevious, isFirstStep }) => {

    const [form, setForm] = useState({
        bp: "",
        sugar: "",
        cholesterol: "",
        thyroid: "",
        uric: "",
        serum3d: ""
    });

    const handleRadio = (name, val) => {
        setForm(prev => ({ ...prev, [name]: val }))
    }

    const handleChange = (e) => {
        setForm(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const submit = (e) => {
        e.preventDefault()
        onNext(form)
    }

    return (
        <div className="space-y-6">
            <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">

                <h3 className="text-orange-500 font-bold border-b border-white/10 pb-2 uppercase tracking-wider">
                    Health History Questionnaire
                </h3>

                <form onSubmit={submit} className="space-y-6">

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

                        <p className="text-white/80 mb-6">
                            Please fill out all information requested below
                        </p>

                        <div className="space-y-4">

                            {questions.map((item, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-12 gap-3 items-center border-b border-white/10 pb-3"
                                >
                                    <div className="col-span-7 md:col-span-8 text-sm md:text-base">
                                        {index + 1}. {item}
                                    </div>

                                    <div className="col-span-5 md:col-span-4 flex gap-6 justify-end">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`q${index}`}
                                                onChange={() => handleRadio(`q${index}`, "Yes")}
                                            />
                                            Yes
                                        </label>

                                        <label className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name={`q${index}`}
                                                onChange={() => handleRadio(`q${index}`, "No")}
                                            />
                                            No
                                        </label>
                                    </div>

                                    {(index === 14 || index === 15) && (
                                        <div className="col-span-12 mt-3">
                                            <input
                                                type="text"
                                                name={`specify${index}`}
                                                placeholder="List specifies"
                                                onChange={handleChange}
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3"
                                            />
                                        </div>
                                    )}

                                </div>
                            ))}

                        </div>

                    </div>


                    {/* Medical Information */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

                        <h3 className="text-orange-400 font-bold text-xl mb-6">
                            Medical Information
                        </h3>

                        <div className="grid md:grid-cols-2 gap-5">

                            <div>
                                <label className="block mb-2">Blood Pressure</label>
                                <input
                                    name="bp"
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Blood Sugar</label>
                                <input
                                    name="sugar"
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Blood Cholesterol</label>
                                <input
                                    name="cholesterol"
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Thyroid Level</label>
                                <input
                                    name="thyroid"
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Blood Uric Acid</label>
                                <input
                                    name="uric"
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Serum 3D</label>
                                <input
                                    name="serum3d"
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>

                        </div>

                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onPrevious}
                            disabled={isFirstStep}
                            className="flex-1 py-3 bg-gray-700 rounded-lg"
                        >
                            Previous
                        </button>

                        <button
                            type="submit"
                            className="flex-1 py-3 bg-orange-600 rounded-lg font-bold"
                        >
                            Next Step
                        </button>
                    </div>

                </form>


                <style jsx>{`
.input{
width:100%;
background:rgba(255,255,255,.08);
border:1px solid rgba(255,255,255,.2);
padding:12px;
border-radius:10px;
color:white;
}
`}</style>

            </div>
        </div>
    )

}

export default HealthHistory2;
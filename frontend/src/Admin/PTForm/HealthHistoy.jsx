import React, { useState } from "react";

const HealthHistoy = ({ onNext, onPrevious, formData, isFirstStep }) => {

    const [form, setForm] = useState({
        medications: formData?.medications || "",
        med1: formData?.med1 || "",
        dose1: formData?.dose1 || "",
        reason1: formData?.reason1 || "",
        med2: formData?.med2 || "",
        dose2: formData?.dose2 || "",
        reason2: formData?.reason2 || "",
        med3: formData?.med3 || "",
        dose3: formData?.dose3 || "",
        reason3: formData?.reason3 || "",
        allergies: formData?.allergies || "",
        surgeries1: formData?.surgeries1 || "",
        surgeries2: formData?.surgeries2 || "",
        surgeries3: formData?.surgeries3 || "",
        exercise_program: formData?.exercise_program || "",
        sports: formData?.sports || "",
        sport1: formData?.sport1 || "",
        sport2: formData?.sport2 || "",
        sport3: formData?.sport3 || "",
        sport4: formData?.sport4 || "",
        sport5: formData?.sport5 || "",
        sport6: formData?.sport6 || "",
        smoking: formData?.smoking || "",
        alcohol: formData?.alcohol || "",
        food_preference: formData?.food_preference || "",
        supplements: formData?.supplements || ""
    })

    React.useEffect(() => {
        if (formData) {
            setForm(prev => ({ ...prev, ...formData }));
        }
    }, [formData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onNext(form)
    }

    return (
        <div className="space-y-6">
            <div className="border-2 border-white/20 rounded-2xl p-8 bg-white/[0.02] shadow-xl">

                <h3 className="text-orange-500 font-bold border-b border-white/10 pb-2 uppercase tracking-wider">
                    Health History Questionnaire
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Medications */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <p className="mb-4 text-white">
                            Are you taking any medications?
                        </p>

                        <div className="flex gap-8 mb-5">
                            <label>
                                <input
                                    type="radio"
                                    name="medications"
                                    value="Yes"
                                    checked={form.medications === "Yes"}
                                    onChange={handleChange}
                                /> Yes
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    name="medications"
                                    value="No"
                                    checked={form.medications === "No"}
                                    onChange={handleChange}
                                /> No
                            </label>
                        </div>

                        <p className="text-orange-400 mb-4">
                            If yes, complete the following
                        </p>

                        <div className="grid md:grid-cols-3 gap-4">
                            <input name="med1"  value={form.med1} onChange={handleChange}
                                placeholder="Name"
                                className="input" />

                            <input name="dose1" value={form.dose1} onChange={handleChange}
                                placeholder="Dosage/Frequency"
                                className="input" />

                            <input name="reason1" value={form.reason1} onChange={handleChange}
                                placeholder="Reason"
                                className="input" />

                            <input name="med2" value={form.med2} onChange={handleChange}
                                placeholder="Name"
                                className="input" />

                            <input name="dose2" value={form.dose2} onChange={handleChange}
                                placeholder="Dosage/Frequency"
                                className="input" />

                            <input name="reason2" value={form.reason2} onChange={handleChange}
                                placeholder="Reason"
                                className="input" />

                            <input name="med3" value={form.med3} onChange={handleChange}
                                placeholder="Name"
                                className="input" />

                            <input name="dose3" value={form.dose3} onChange={handleChange}
                                placeholder="Dosage/Frequency"
                                className="input" />

                            <input name="reason3" value={form.reason3} onChange={handleChange}
                                placeholder="Reason"
                                className="input" />
                        </div>
                    </div>


                    {/* Allergies */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <label className="block mb-2">
                            Please list any allergies
                        </label>

                        <input
                            name="allergies"
                            value={form.allergies}
                            onChange={handleChange}
                            className="input w-full"
                        />
                    </div>


                    {/* Surgeries */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <p className="mb-4">
                            Have you undergone any major surgeries/major accidents?
                        </p>

                        <input
                            name="surgeries1"
                            value={form.surgeries1}
                            placeholder="1."
                            onChange={handleChange}
                            className="input w-full mb-3"
                        />

                        <input
                            name="surgeries2"
                            value={form.surgeries2}
                            placeholder="2."
                            onChange={handleChange}
                            className="input w-full mb-3"
                        />

                        <input
                            name="surgeries3"
                            value={form.surgeries3}
                            placeholder="3."
                            onChange={handleChange}
                            className="input w-full"
                        />
                    </div>


                    {/* Exercise Program */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">

                        <p className="mb-4">
                            Are you currently involved in any exercise program?
                        </p>

                        <div className="flex gap-8 mb-6">
                            <label>
                                <input
                                    type="radio"
                                    name="exercise_program"
                                    value="Yes"
                                    checked={form.exercise_program === "Yes"}
                                    onChange={handleChange}
                                /> Yes
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    name="exercise_program"
                                    value="No"
                                    checked={form.exercise_program === "No"}
                                    onChange={handleChange}
                                /> No
                            </label>
                        </div>


                        <p className="mb-4">
                            Are you involved in recreational sports?
                        </p>

                        <div className="grid md:grid-cols-2 gap-4">
                            <input name="sport1" value={form.sport1} placeholder="1." onChange={handleChange} className="input" />
                            <input name="sport4" value={form.sport4} placeholder="4." onChange={handleChange} className="input" />

                            <input name="sport2" value={form.sport2} placeholder="2." onChange={handleChange} className="input" />
                            <input name="sport5" value={form.sport5} placeholder="5." onChange={handleChange} className="input" />

                            <input name="sport3" value={form.sport3} placeholder="3." onChange={handleChange} className="input" />
                            <input name="sport6" value={form.sport6} placeholder="6." onChange={handleChange} className="input" />
                        </div>

                    </div>


                    {/* Lifestyle */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-orange-400 font-bold mb-5">
                            LIFESTYLE AND DIETARY FACTORS
                        </h3>

                        <p className="mb-4 font-semibold">
                            Smoking and Alcohol Consumption
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">

                            <div>
                                <label>Smoking</label>
                                <select
                                    name="smoking"
                                    onChange={handleChange}
                                    className="input w-full mt-2"
                                    value={form.smoking}
                                >
                                    <option value="">Select</option>
                                    <option>Yes</option>
                                    <option>No</option>
                                </select>
                            </div>

                            <div>
                                <label>Alcohol</label>
                                <select
                                    name="alcohol"
                                    onChange={handleChange}
                                    className="input w-full mt-2"
                                    value={form.alcohol}
                                >
                                    <option value="">Select</option>
                                    <option>Yes</option>
                                    <option>No</option>
                                </select>
                            </div>

                        </div>


                        <div className="mt-6">
                            <label className="block mb-3">
                                Food Preference
                            </label>

                            <div className="flex gap-8">
                                <label>
                                    <input
                                        type="radio"
                                        name="food_preference"
                                        value="Veg"
                                        onChange={handleChange}
                                        checked={form.food_preference === "Veg"}
                                    /> Veg
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name="food_preference"
                                        value="Non-Veg"
                                        onChange={handleChange}
                                        checked={form.food_preference === "Non-Veg"}
                                    /> Non-Veg
                                </label>
                            </div>
                        </div>


                        <div className="mt-6">
                            <label className="block mb-3">
                                Do you take dietary supplements?
                            </label>

                            <div className="flex gap-8">
                                <label>
                                    <input
                                        type="radio"
                                        name="supplements"
                                        value="Yes"
                                        onChange={handleChange}
                                        checked={form.supplements === "Yes"}
                                    /> Yes
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name="supplements"
                                        value="No"
                                        onChange={handleChange}
                                        checked={form.supplements === "No"}
                                    /> No
                                </label>
                            </div>

                        </div>

                    </div>

                    <div className="flex gap-3 pt-6">
                        <button
                            type="button"
                            onClick={onPrevious}
                            disabled={isFirstStep}
                            className="flex-1 px-4 py-3 bg-gray-700 rounded-lg"
                        >
                            Previous
                        </button>

                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-orange-600 rounded-lg font-bold"
                        >
                            Next Step
                        </button>
                    </div>

                </form>

                <style jsx>{`
.input{
background:rgba(255,255,255,.08);
border:1px solid rgba(255,255,255,.2);
padding:12px;
border-radius:10px;
width:100%;
color:white;
}
`}</style>

            </div>
        </div>
    )

}

export default HealthHistoy
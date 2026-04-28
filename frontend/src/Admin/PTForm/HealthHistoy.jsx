import React, { useState } from "react";

const HealthHistoy = ({ onNext, onPrevious, isFirstStep }) => {

    const [form, setForm] = useState({
        medications: "",
        med1: "",
        dose1: "",
        reason1: "",
        med2: "",
        dose2: "",
        reason2: "",
        med3: "",
        dose3: "",
        reason3: "",
        allergies: "",
        surgeries1: "",
        surgeries2: "",
        surgeries3: "",
        exercise_program: "",
        sports: "",
        sport1: "",
        sport2: "",
        sport3: "",
        sport4: "",
        sport5: "",
        sport6: "",
        smoking: "",
        alcohol: "",
        food_preference: "",
        supplements: ""
    })

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
                                onChange={handleChange}
                            /> Yes
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="medications"
                                value="No"
                                onChange={handleChange}
                            /> No
                        </label>
                    </div>

                    <p className="text-orange-400 mb-4">
                        If yes, complete the following
                    </p>

                    <div className="grid md:grid-cols-3 gap-4">
                        <input name="med1" onChange={handleChange}
                            placeholder="Name"
                            className="input" />

                        <input name="dose1" onChange={handleChange}
                            placeholder="Dosage/Frequency"
                            className="input" />

                        <input name="reason1" onChange={handleChange}
                            placeholder="Reason"
                            className="input" />

                        <input name="med2" onChange={handleChange}
                            placeholder="Name"
                            className="input" />

                        <input name="dose2" onChange={handleChange}
                            placeholder="Dosage/Frequency"
                            className="input" />

                        <input name="reason2" onChange={handleChange}
                            placeholder="Reason"
                            className="input" />

                        <input name="med3" onChange={handleChange}
                            placeholder="Name"
                            className="input" />

                        <input name="dose3" onChange={handleChange}
                            placeholder="Dosage/Frequency"
                            className="input" />

                        <input name="reason3" onChange={handleChange}
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
                        placeholder="1."
                        onChange={handleChange}
                        className="input w-full mb-3"
                    />

                    <input
                        name="surgeries2"
                        placeholder="2."
                        onChange={handleChange}
                        className="input w-full mb-3"
                    />

                    <input
                        name="surgeries3"
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
                                onChange={handleChange}
                            /> Yes
                        </label>

                        <label>
                            <input
                                type="radio"
                                name="exercise_program"
                                value="No"
                                onChange={handleChange}
                            /> No
                        </label>
                    </div>


                    <p className="mb-4">
                        Are you involved in recreational sports?
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <input name="sport1" placeholder="1." onChange={handleChange} className="input" />
                        <input name="sport4" placeholder="4." onChange={handleChange} className="input" />

                        <input name="sport2" placeholder="2." onChange={handleChange} className="input" />
                        <input name="sport5" placeholder="5." onChange={handleChange} className="input" />

                        <input name="sport3" placeholder="3." onChange={handleChange} className="input" />
                        <input name="sport6" placeholder="6." onChange={handleChange} className="input" />
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
                                /> Veg
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    name="food_preference"
                                    value="Non-Veg"
                                    onChange={handleChange}
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
                                /> Yes
                            </label>

                            <label>
                                <input
                                    type="radio"
                                    name="supplements"
                                    value="No"
                                    onChange={handleChange}
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
    )

}

export default HealthHistoy
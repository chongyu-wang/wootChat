import React, {useState, useContext} from "react";
import axios from "axios";
import {UserContext} from "./UserContext";

export default function RegisterAndLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLOR, setIsLOR] = useState('register');
    const [confirmPassword, setConfirmPassword] = useState("");
    const [incorrectPasswordMessage, setIncorrectPasswordMessage] = useState("");
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);

    function handleUser(event) {setUsername(event.target.value);}
    function handlePassword(event) {setPassword(event.target.value);}
    function handleConfirmPassword(event) {setConfirmPassword(event.target.value)}

    async function handleSubmit(event) {
        if (isLOR === "login" || (isLOR == "register" && password === confirmPassword)){
            event.preventDefault();
            const url = isLOR === "register" ? "/register" : "/login";
            const {data} = await axios.post(url, {username, password});
            setLoggedInUsername(username);
            setId(data.id);
        }
        else {
            event.preventDefault();
            setIncorrectPasswordMessage("Passwords do not match");
        }
    }

    return (
    <div className="bg-gray-500 h-screen flex items-center">
        <form className="w-64 mx-auto mb-12"onSubmit={handleSubmit}>
            <div className="text-center text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" 
                className="w-20 h-20 mt-2 mx-auto">
                    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                </svg>
                wootCHAT
            </div>
            <input value={username} 
                    onChange={handleUser} 
                    type="text" placeholder="Username" 
                    className="block w-full rounded-sm p-2 mb-2 border"/>
            <input value={password} 
                    onChange={handlePassword} 
                    type="password" placeholder="Password" 
                    className="block w-full rounded-sm p-2 mb-2 border"/>
            {isLOR === "register" && <input value={confirmPassword} 
                    onChange={handleConfirmPassword} 
                    type="password" placeholder="Confirm Password" 
                    className="block w-full rounded-sm p-2 mb-2 border"/>}
            <button className="bg-gray-900 text-white block w-full rounded-sm p-2">
                {isLOR === "register" ? "Register" : "Login"}
            </button>
            {incorrectPasswordMessage.length > 1 && 
            <p className="text-center mt-2">{incorrectPasswordMessage}</p>}
            {isLOR === "register" && 
            <div className="text-center mt-2">
                Already a member?  
                <button className="ml-1" onClick = {() => setIsLOR("login")}> Login here</button>
            </div>}
            {isLOR === "login" && 
            <div className="text-center mt-2">
                Don't have an account yet?  
                <button className="ml-1" onClick = {() => setIsLOR("register")}> Register here</button>
            </div>}
        </form>
    </div>
    );
}
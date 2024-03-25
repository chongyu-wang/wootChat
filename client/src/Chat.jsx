import {useContext, useEffect, useRef, useState} from "react";
import { UserContext } from "./UserContext";
import {uniqBy} from "lodash";
import Avatar from "./Avatar";
import axios from "axios";
import Logo from "./Logo";
import Contact from "./Contact";

export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [offlinePeople, setOfflinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState("");
    const [messages, setMessages] = useState([]);
    const {username, id, setId, setUsername} = useContext(UserContext);
    const divUnderMessages = useRef();

    useEffect(() => {
        connectToWs();

    }, []);
    function connectToWs() {
        const ws = new WebSocket("ws://localhost:3000");
        setWs(ws);
        ws.addEventListener("message", handleMessage);
        ws.addEventListener("close", () => {
            setTimeout(() => {
                console.log("Disconnected. Trying to reconnect");
            }, 1000);
        });
    }
    function showOnlinePeople(peopleArray) {
        const people = {};
        peopleArray.forEach(({userId, username}) => {
            people[userId] = username;
        });
        setOnlinePeople(people);
    }
    function handleMessage(ev) {
        const messageData = JSON.parse(ev.data);
        console.log({ev, messageData});
        if ("online" in messageData) {
            showOnlinePeople(messageData.online);
        }else if ("text" in messageData) {
            if (messageData.sender === selectedUserId){
                setMessages(prev => ([...prev, {...messageData}]));
            }
        }
    }
    function logout() {
        axios.post("/logout").then(() =>{
            setWs(null);
            setId(null);
            setUsername(null);
        })
    }
    function sendMessage(ev, file=null) {
        if (ev) ev.preventDefault();
        // console.log("sending");
        ws.send(JSON.stringify({
            recipient: selectedUserId,
            text: newMessageText,
            file,
        }));
        if (file) {
            axios.get("/messages/"+selectedUserId).then(res => {
                setMessages(res.data);
            });
        }
        else {
            setNewMessageText("");
            console.log("message sent");
            setMessages(prev => ([...prev, {
                text: newMessageText, 
                sender: id,
                recipient: selectedUserId,
                _id: Date.now(),
            }]));
        }
    }

    function sendFile(event) {
        console.log("*********SENDING**********");
        const reader = new FileReader();
        reader.readAsDataURL(event.target.files[0]);
        reader.onload = () => {
            sendMessage(null, {
                name: event.target.files[0].name,
                data: reader.result,
            })
        };
    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div){
            div.scrollIntoView({behavior:"smooth", block:"end"});
        }
    }, [messages]);

    useEffect(() => {
        axios.get("/people").then(res => {
            const offlinePeopleArr = res.data
                .filter(p => p._id !== id)
                .filter(p => !Object.keys(onlinePeople).includes(p._id));
            const offlinePeople = {};
            offlinePeopleArr.forEach(p => {
                offlinePeople[p._id] = p;
            });
            console.log({offlinePeople, offlinePeopleArr});
            setOfflinePeople(offlinePeople);
        })
    },[onlinePeople]);

    useEffect(() => {
        if (selectedUserId) {
            axios.get("/messages/"+selectedUserId).then(res => {
                setMessages(res.data);
            });
        }
    }, [selectedUserId]);

    const onlinePeopleExcludingCurUser = {...onlinePeople};
    delete onlinePeopleExcludingCurUser[id];

    const messagesWithoutDupes = uniqBy(messages, "_id");

    return (
        <div className="flex h-screen">
            <div className="bg-gray-500 w-1/3 flex flex-col">
                <div className="flex-grow">
                    <Logo />
                    {Object.keys(onlinePeopleExcludingCurUser).map(userId => (
                        <Contact
                            key={userId}
                            id={userId} 
                            online={true}
                            username={onlinePeopleExcludingCurUser[userId]}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                        />
                    ))}
                    {Object.keys(offlinePeople).map(userId => (
                        <Contact
                            key={userId} 
                            id={userId} 
                            online={false}
                            username={offlinePeople[userId].username}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                        />
                    ))}
                </div>
                <div className="p-2 text-center flex items-center">
                    <span className="mr-2 text-sm text-gray-100 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {username}
                    </span>
                    <button onClick={logout}
                        className="text-sm bg-gray-700 py-1 px-2 text-gray-200 border rounded-sm">Logout</button>
                </div>
            </div>
            <div className="flex flex-col bg-gradient-to-r from-gray-300 to-gray-200 w-2/3 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (<div className="flex h-full flex-grow items-center justify-center">
                        <div className="text-gray-400 text-lg"><em>&larr; Select a person from the sidebar</em></div>
                    </div>
                    )}
                    {!!selectedUserId && (
                        <div className="relative h-full">
                            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                                {messagesWithoutDupes.map(message => (
                                    <div key={message._id} className={(message.sender === id ? "text-right": "text-left")}>
                                        <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender === id ? "bg-blue-500 text-gray-100": "bg-gray-100 text-gray-900")}>
                                            {/* sender:{message.sender} <br/>
                                            my id: {id}<br/> */}
                                            {message.text}
                                             {message.file && (
                                                <div className="">
                                                    <a target="_blank" className="border-b flex items-center gap-1" href={axios.defaults.baseURL + "/uploads/" + message.file} >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                                        </svg>
                                                    {message.file}
                                                    </a>
                                                </div>
                                             )}
                                        </div>
                                    </div>
                                ))}
                                <div className="" ref={divUnderMessages}></div>
                            </div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-2" onSubmit={sendMessage}>
                        <input type="text" 
                            value={newMessageText}
                            onChange={ev => setNewMessageText(ev.target.value)}
                            placeholder="Type your message here"
                            className="bg-white border p-2 flex-grow rounded-sm"/>
                        <label type="button" className="bg-gray-700 cursor-pointer p-2 text-white rounded-sm border border-gray-500">
                            <input type="file" className="hidden" onChange={sendFile}/>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                            </svg>
                        </label>
                        <button type="submit" className="bg-gray-900 p-2 text-gray-200 rounded-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

import { useContext } from "react";
import Register from "./RegisterAndLoginForm";
import Chat from "./Chat";
import {UserContext} from "./UserContext.jsx";

export default function Routes() {
    const {username, id} = useContext(UserContext);

    if (username) {
        return <Chat />
    }
    return (
        <Register />
    )
}


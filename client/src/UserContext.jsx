import {createContext, useState, useEffect} from "react";
import axios from "axios";

export const UserContext = createContext({});

export function UserContextProvider({children}) {
    const [username, setUsername] = useState(null);
    const [id, setId] = useState(null);
    useEffect(() => {
        console.log("*********AAA************");
        axios.get("/profile")
          .then(response => {
            setId(response.data.userId);
            setUsername(response.data.username);
          })
          .catch(error => {
            // Handle the error here
            console.error("Error fetching profile:", error);
            // You can set a state to indicate the error or perform any necessary actions
          });
      }, []);
    return (
        <UserContext.Provider value={{username, setUsername, id, setId}}>
            {children}
        </UserContext.Provider>
    )
}
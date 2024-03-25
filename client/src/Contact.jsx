import Avatar from "./Avatar.jsx";

export default function Contact({id, username, onClick, selected, online}) {
    return (
        <div key={id} onClick={() => onClick(id)} 
        className={"border-b border-gray-400 flex gap-2 items-center cursor-pointer " + (selected ? "bg-gray-600" : "")}>
            {id === selected && (
            <div className="w-1 h-12 rounded-r-md bg-gray-900"></div>
            )}
            <div className="flex gap-2 py-2 pl-4 items-center">
                <Avatar online={online} username={username} userId={id} />
                <span className="text-gray-200">{username}</span>
            </div>
        </div>
    );
}

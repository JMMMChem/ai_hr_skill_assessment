type MessageSender = "human" | "bot";

type MessageType = 'PLOT' | 'TABLE'


export interface Team {
    id: number;
    name: string;
    description: string;
}

export interface User {
    id: number;
    email: string;
    name: string;
    is_admin: boolean;
    teams: Team[];
}

export interface Message {
    content: string;
    role: MessageSender;
    type?: MessageType;
    data?: PlotResponse[];
}

export interface PlotResponse {
    value: string
    date: Date
}

export interface ChatResponse {
    completion: string;
    sources?: string[]; // Added sources as an optional array of strings
    data?: PlotResponse[]; // Optional data field for plots
    type?: MessageType; // Optional type field
}


export interface CharacterInterface {
    id: number;
    name: string;
    description: string;
}

export interface DocumentInterface {
    id: number;
    title: string;
    path_url: string;
}

export interface CreateChat {
    title: string;   
    assistantId: number;
}

export interface CreateChatTrainer {
    title: string;   
    characterId: number;
}

export interface ChatInterface {
    id: number;
    title: string;
}

export interface TeamInterface {
    id: number;
    name: string;
    description: string;
}

export interface CreateTeam {
    name: string;
    description: string;
}
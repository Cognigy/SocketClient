import { IAdaptiveCard } from 'adaptivecards';

/**
 * 
 * Fields used by chat-components and currently added by the Webchat Client. 
 * Expected to be present in the socket message sent by endpoint at some point.
*/
export interface IWebchatClientMessage {
	avatarUrl?: string;
	avatarName?: string;
	timestamp?: string;
}
// We temporary extend IMessage with IWebchatClientMessage
// to avoid making changes in the codebase. See prev. comment.
export interface IMessage extends IWebchatClientMessage{
	text?: string | null;
	data?: IMessageData;
	source?: "user" | "bot" | "engagement" | "agent";
	disableSensitiveLogging?: boolean;
	traceId?: string;
};

export interface IMessageData {
	_cognigy?: ICognigyData;
	_plugin?: IPluginDatepicker | IPluginXApp;
}

export interface ICognigyData {
	_default?: IDefaultMessage;
	_webchat?: IWebchatMessage | IAdaptiveCardMessage;
	_plugin?: unknown;
	_facebook?: IWebchatMessage;
	syncWebchatWithFacebook?: boolean;
	controlCommands?: ISetRatingControlCommand[];
}

export interface IPluginXApp {
    type: "x-app";
    data: {
        sessionUrl: string;
        openButtonLabel?: string;
        immediateOpen?: boolean;
		headerTitle?: string;
    };
}

export interface IPluginDatepicker {
	type: "date-picker";
	data: {
		eventName?: string;
		locale?: string;
		enableTime?: string | boolean;
		defaultDate?: string,
		mode?: "range" | "single" | "multiple";
		wantDisable?: string | boolean;
		enable_disable?: string[] | boolean | null;
		function_enable_disable?: string;
		minDate?: string;
		maxDate?: string;
		openPickerButtonText?: string;
		cancelButtonText?: string;
		submitButtonText?: string;
		time_24hr?: string | boolean;
		dateFormat?: string;
		defaultHour?: number;
		defaultMinute?: number;
		enableSeconds?: number;
		hourIncrement?: number;
		minuteIncrement?: number;
		noCalendar?: boolean;
		weekNumbers?: boolean;
	};
}

export type TButtonType = "postback" | "web_url" | "phone_number";

/**
 * Default Message Interfaces
*/

export interface IDefaultMessage {
	_quickReplies?: IDefaultQuickReplies;
	_gallery?: IDefaultGallery;
	_buttons?: IDefaultButtons;
	_list?: IDefaultList;
	_audio?: IDefaultAudio;
	_image?: IDefaultImage;
	_video?: IDefaultVideo;
	_adaptiveCard?: IAdaptiveCardMessage;
};

export interface IDefaultQuickReplies {
	type: string;
	quickReplies: IDefaultQuickReply[];
	text: string;
}

export interface IDefaultButtons {
	type: string;
	buttons: IDefaultButton[];
	text: string;
}

export interface IDefaultQuickReply {
	id: number;
	title: string;
	imageAltText?: string;
	imageUrl?: string;
	contentType: string;
	payload: string;
}

export interface IDefaultButton {
	id?: number;
	title: string;
	type: TButtonType;
	payload?: string;
	url?: string;
	target?: "_blank" | "_self";
}

export interface IDefaultGallery {
	type: "carousel";
	items: IDefaultGalleryItem[];
}

export interface IDefaultItem {
	title: string;
	subtitle: string;
	imageUrl: string;
	buttons?: IDefaultButton[] | null;
	imageAltText?: string;
}

export interface IDefaultGalleryItem extends IDefaultItem {
	id: number;
}

export interface IDefaultList {
	type: "list";
	items?: IDefaultListItem[];
	button: IDefaultListButton;
}

export interface IDefaultListItem extends IDefaultItem {
	defaultActionUrl: string;
}

export interface IDefaultListButton extends IDefaultButton {
	condition: string;
}

export interface IDefaultAudio {
	type: "audio";
	audioUrl: string;
	audioAltText: string;
}

export interface IDefaultImage {
	type: "image";
	imageUrl: string;
	imageAltText: string;
	buttons?: IWebchatButton[] | null;
}

export interface IDefaultVideo {
	type: "video";
	videoUrl: string;
	videoAltText: string;
}

export interface IAdaptiveCardMessage {
	type: "adaptiveCard";
	adaptiveCard: IAdaptiveCard;
}

/**
 * Webchat Message Interfaces
*/

export interface IWebchatMessage {
	message?: {
		text?: string;
		quick_replies?: IWebchatQuickReply[];
		attachment?: IWebchatTemplateAttachment | IWebchatAudioAttachment | IWebchatImageAttachment | IWebchatVideoAttachment;
	},
}

export interface IWebchatQuickReply {
	title: string;
	payload?: string;
	image_alt_text?: string;
	image_url?: string;
	content_type: string;
}

export interface IWebchatTemplateAttachment {
	type: "template";
	payload: {
		template_type: "generic" | "button" | "list";
		elements?: IWebchatAttachmentElement[];
		buttons?: IWebchatButton[] | null;
		text?: string;
		top_element_style?: "compact" | "large" | boolean;
	};
}

export interface IWebchatAudioAttachment {
	type: "audio";
	payload: {
		url: string;
		altText: string;
	};
}

export interface IWebchatImageAttachment {
	type: "image";
	payload: {
		url: string;
		altText: string;
		buttons?: IWebchatButton[] | null;
	};
}

export interface IWebchatVideoAttachment {
	type: "video";
	payload: {
		url: string;
		altText: string;
	};
}

export interface IWebchatAttachmentElement {
	title: string;
	subtitle: string;
	image_url: string;
	image_alt_text?: string;
	buttons?: IWebchatButton[] | null;
	default_action?: {
		type: string;
		url?: string;
	};
}

export interface IWebchatButton {
	title: string;
	type: TButtonType;
	payload?: string;
	url?: string;
	webview_height_ratio?: string;
	messenger_extensions?: boolean;
	target?: "_blank" | "_self";
}

export interface ISetRatingControlCommand {
	type: "setRating";
	parameters: {
		rating: number;
		comment?: string;
		showRatingStatus?: boolean;
	};
}
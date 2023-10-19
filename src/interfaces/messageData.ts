

export interface IMessageData {
	_cognigy: ICognigyData;
}

export interface ICognigyData {
	_default?: IDefaultMessage;
	_webchat?: IWebchatMessage | IAdaptiveCard;
	_plugin?: unknown;
	_facebook?: IWebchatMessage;
	syncWebchatWithFacebook?: boolean;
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
	_adaptiveCard?: IAdaptiveCard;
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
	buttons: IDefaultButton[];
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
}

export interface IDefaultVideo {
	type: "video";
	videoUrl: string;
	videoAltText: string;
}

export interface IAdaptiveCard {
	type: "adaptiveCard";
	adaptiveCard: unknown;
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
		buttons?: IWebchatButton[];
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
	buttons: IWebchatButton[];
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


export interface IMessageData {
	_cognigy: ICognigyData;
}

export interface ICognigyData {
	_default: IDefaultMessage;
	_webchat: IWebchatMessage | IAdaptiveCard;
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
	adaptiveCard: any;
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
	payload: string;
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
		top_element_style?: "compact" | "large";
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
		url: string;
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

const adaptiveCardEmpty: IMessageData = {
	"_cognigy": {
		"_default": {
			"_adaptiveCard": {
				"type": "adaptiveCard",
				"adaptiveCard": {
					"$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
					"type": "AdaptiveCard",
					"version": "1.0",
					"body": []
				}
			}
		},
		"_webchat": {
			"type": "adaptiveCard",
			"adaptiveCard": {
				"$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
				"type": "AdaptiveCard",
				"version": "1.0",
				"body": []
			}
		}
	}
}

const video: IMessageData = {
	"_cognigy": {
		"_default": {
			"_video": {
				"type": "video",
				"videoUrl": "video_url",
				"videoAltText": "video alt text"
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "video",
					"payload": {
						"url": "video_url",
						"altText": "video alt text"
					}
				}
			}
		}
	}
}

const image: IMessageData = {
	"_cognigy": {
		"_default": {
			"_image": {
				"type": "image",
				"imageUrl": "img_url",
				"imageAltText": "img alt text"
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "image",
					"payload": {
						"url": "img_url",
						"altText": "img alt text"
					}
				}
			}
		}
	}
}

const audio: IMessageData = {
	"_cognigy": {
		"_default": {
			"_audio": {
				"type": "audio",
				"audioUrl": "audio_url",
				"audioAltText": "audio alt text"
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "audio",
					"payload": {
						"url": "audio_url",
						"altText": "audio alt text"
					}
				}
			}
		}
	}
}


const list3: IMessageData = {
	"_cognigy": {
		"_default": {
			"_list": {
				"type": "list",
				"items": [
					{
						"title": "List 1 Item only",
						"subtitle": "",
						"imageUrl": "",
						"defaultActionUrl": "",
						"buttons": []
					}
				],
				"button": null
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "template",
					"payload": {
						"template_type": "list",
						"elements": [
							{
								"title": "List 1 Item only",
								"subtitle": "",
								"image_url": "",
								"buttons": []
							}
						],
						"buttons": [],
						"top_element_style": "compact"
					}
				}
			}
		}
	}
}

const list2: IMessageData = {
	"_cognigy": {
		"_default": {
			"_list": {
				"type": "list",
				"button": {
					"condition": "",
					"title": "List button only",
					"type": "web_url",
					"url": "url_info",
					"target": "_blank"
				}
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "template",
					"payload": {
						"template_type": "list",
						"elements": [],
						"buttons": [
							{
								"type": "web_url",
								"title": "List button only",
								"url": "url_info",
								"messenger_extensions": false,
								"webview_height_ratio": "full",
								"target": "_blank"
							}
						],
						"top_element_style": "compact"
					}
				}
			}
		}
	}
}

const list: IMessageData = {
	"_cognigy": {
		"_default": {
			"_list": {
				"type": "list",
				"items": [
					{
						"title": "List item 1",
						"subtitle": "subtitle",
						"imageUrl": "img_url",
						"defaultActionUrl": "default_action_url",
						"imageAltText": "img alt text",
						"buttons": []
					},
					{
						"title": "List item 2",
						"subtitle": "",
						"imageUrl": "",
						"defaultActionUrl": "",
						"buttons": []
					},
					{
						"title": "List Item 3 with button",
						"subtitle": "",
						"imageUrl": "",
						"defaultActionUrl": "",
						"buttons": [
							{
								"title": "List item postback button",
								"type": "postback",
								"payload": "PB value"
							}
						]
					}
				],
				"button": {
					"condition": "",
					"title": "button title",
					"type": "web_url",
					"url": "url_info",
					"target": "_blank"
				}
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "template",
					"payload": {
						"template_type": "list",
						"elements": [
							{
								"title": "List item 1",
								"subtitle": "subtitle",
								"image_url": "img_url",
								"image_alt_text": "img alt text",
								"buttons": [],
								"default_action": {
									"type": "web_url",
									"url": "default_action_url"
								}
							},
							{
								"title": "List item 2",
								"subtitle": "",
								"image_url": "",
								"buttons": []
							},
							{
								"title": "List Item 3 with button",
								"subtitle": "",
								"image_url": "",
								"buttons": [
									{
										"type": "postback",
										"payload": "PB value",
										"title": "List item postback button",
										"url": "",
										"webview_height_ratio": "full",
										"messenger_extensions": false
									}
								]
							}
						],
						"buttons": [
							{
								"type": "web_url",
								"title": "button title",
								"url": "url_info",
								"messenger_extensions": false,
								"webview_height_ratio": "full",
								"target": "_blank"
							}
						],
						"top_element_style": "compact"
					}
				}
			}
		}
	}
}

const textNoButtons: IMessageData = {
	"_cognigy": {
		"_default": {
			"_buttons": {
				"type": "buttons",
				"text": "text with buttons no buttons",
				"buttons": []
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "template",
					"payload": {
						"text": "text with buttons no buttons",
						"template_type": "button",
						"buttons": []
					}
				}
			}
		}
	}
}

const textWithButtons: IMessageData = {
	"_cognigy": {
		"_default": {
			"_buttons": {
				"type": "buttons",
				"text": "text with buttons",
				"buttons": [
					{
						"id": 0.27194027073982907,
						"title": "Postback Value",
						"type": "postback",
						"payload": "value"
					},
					{
						"id": 0.1557468983750252,
						"title": "URL",
						"type": "web_url",
						"url": "url_string",
						"target": "_self"
					},
					{
						"id": 0.2579326326398639,
						"title": "Phone number",
						"type": "phone_number",
						"payload": "123456789"
					},
					{
						"id": 0.7173255470012199,
						"title": "trigger Intent",
						"type": "postback",
						"payload": "cIntent:intent_name"
					}
				]
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "template",
					"payload": {
						"text": "text with buttons",
						"template_type": "button",
						"buttons": [
							{
								"type": "postback",
								"payload": "value",
								"title": "Postback Value",
								"url": "",
								"webview_height_ratio": "full",
								"messenger_extensions": false
							},
							{
								"type": "web_url",
								"title": "URL",
								"url": "url_string",
								"messenger_extensions": false,
								"webview_height_ratio": "full",
								"target": "_self"
							},
							{
								"title": "Phone number",
								"type": "phone_number",
								"payload": "123456789"
							},
							{
								"type": "postback",
								"payload": "cIntent:intent_name",
								"title": "trigger Intent",
								"url": "",
								"webview_height_ratio": "full",
								"messenger_extensions": false
							}
						]
					}
				}
			}
		}
	}
}

const qrs: IMessageData = {
	"_cognigy": {
		"_default": {
			"_quickReplies": {
				"type": "quick_replies",
				"quickReplies": [
					{
						"id": 0.40858697459766447,
						"title": "QR 1 Postback",
						"imageAltText": "img alt text",
						"imageUrl": "img url",
						"contentType": "postback",
						"payload": "value"
					},
					{
						"id": 0.24612541943521915,
						"title": "QR 2 Phone number",
						"imageAltText": "img alt text",
						"imageUrl": "img url",
						"contentType": "phone_number",
						"payload": "123456789"
					},
					{
						"id": 0.6826645104884401,
						"title": "QR 3 Trigger Intent",
						"imageAltText": "img alt text",
						"imageUrl": "img url",
						"contentType": "postback",
						"payload": "cIntent:Intent name"
					}
				],
				"text": "Hi. text with QRs."
			}
		},
		"_webchat": {
			"message": {
				"text": "Hi. text with QRs.",
				"quick_replies": [
					{
						"content_type": "text",
						"image_url": "img url",
						"image_alt_text": "img alt text",
						"payload": "value",
						"title": "QR 1 Postback"
					},
					{
						"content_type": "user_phone_number",
						"image_url": "img url",
						"image_alt_text": "img alt text",
						"payload": "123456789",
						"title": "QR 2 Phone number"
					},
					{
						"content_type": "text",
						"image_url": "img url",
						"image_alt_text": "img alt text",
						"payload": "cIntent:Intent name",
						"title": "QR 3 Trigger Intent"
					}
				]
			}
		}
	}
}

const gallery: IMessageData = {
	"_cognigy": {
		"_default": {
			"_gallery": {
				"type": "carousel",
				"items": [
					{
						"title": "card 1 no button",
						"subtitle": "subtitle",
						"imageUrl": "img_url",
						"buttons": [],
						"id": 0.7378126916622143,
						"imageAltText": "img alt text"
					},
					{
						"title": "Card 2 one button",
						"subtitle": "subtitle",
						"imageUrl": "",
						"buttons": [
							{
								"id": 0.5033661777932787,
								"title": "Postback button",
								"type": "postback",
								"payload": "postback value"
							}
						],
						"id": 0.22189076641420158
					},
					{
						"title": "card 3 multi button",
						"subtitle": "",
						"imageUrl": "",
						"buttons": [
							{
								"id": 0.5014458213202604,
								"title": "URL",
								"type": "web_url",
								"url": "url to open",
								"target": "_blank"
							},
							{
								"id": 0.9110608786920622,
								"title": "phone number",
								"type": "phone_number",
								"payload": "123456789"
							},
							{
								"id": 0.4205054057593105,
								"title": "trigger intent",
								"type": "postback",
								"payload": "cIntent:intent_name"
							}
						],
						"id": 0.09297883389643746
					}
				]
			}
		},
		"_webchat": {
			"message": {
				"attachment": {
					"type": "template",
					"payload": {
						"template_type": "generic",
						"elements": [
							{
								"title": "card 1 no button",
								"subtitle": "subtitle",
								"image_url": "img_url",
								"image_alt_text": "img alt text",
								"buttons": []
							},
							{
								"title": "Card 2 one button",
								"subtitle": "subtitle",
								"image_url": "",
								"buttons": [
									{
										"type": "postback",
										"payload": "postback value",
										"title": "Postback button",
										"url": "",
										"webview_height_ratio": "full",
										"messenger_extensions": false
									}
								]
							},
							{
								"title": "card 3 multi button",
								"subtitle": "",
								"image_url": "",
								"buttons": [
									{
										"type": "web_url",
										"title": "URL",
										"url": "url to open",
										"messenger_extensions": false,
										"webview_height_ratio": "full",
										"target": "_blank"
									},
									{
										"title": "phone number",
										"type": "phone_number",
										"payload": "123456789"
									},
									{
										"type": "postback",
										"payload": "cIntent:intent_name",
										"title": "trigger intent",
										"url": "",
										"webview_height_ratio": "full",
										"messenger_extensions": false
									}
								]
							}
						]
					}
				}
			}
		}
	}
}
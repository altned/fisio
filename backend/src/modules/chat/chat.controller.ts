import { Controller, Get, Post, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtGuard } from '../../common/auth';

@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    /**
     * Get chat room info for a booking
     */
    @Get(':bookingId')
    async getRoomInfo(@Param('bookingId') bookingId: string) {
        try {
            return await this.chatService.getRoomInfo(bookingId);
        } catch (error: any) {
            console.error('[ChatController] Error in getRoomInfo:', error);
            return {
                status: 'ERROR',
                message: error.message,
                stack: error.stack
            };
        }
    }

    /**
     * Get messages for a chat room
     */
    @Get(':bookingId/messages')
    async getMessages(@Param('bookingId') bookingId: string) {
        return this.chatService.getMessages(bookingId);
    }

    /**
     * Send a message to chat room
     */
    @Post(':bookingId/messages')
    async sendMessage(
        @Param('bookingId') bookingId: string,
        @Body() body: { text: string },
        @Request() req: any,
    ) {
        if (!body.text?.trim()) {
            throw new BadRequestException('Pesan tidak boleh kosong');
        }

        return this.chatService.sendMessage(bookingId, {
            senderId: req.user.id,
            senderName: req.user.fullName || req.user.email,
            text: body.text.trim(),
        });
    }

    /**
     * ⚠️ DEV ONLY - Manually open a chat room
     */
    @Post(':bookingId/open')
    async openRoom(
        @Param('bookingId') bookingId: string,
        @Request() req: any,
    ) {
        if (process.env.NODE_ENV === 'production') {
            throw new BadRequestException('Not allowed in production');
        }
        await this.chatService.openRoom(bookingId, [req.user.id]);
        return { ok: true, message: 'Chat room opened' };
    }
}

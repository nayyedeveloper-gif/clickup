<?php

namespace App\Mail;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $task;

    public $user;

    public $action;

    public $message;

    public function __construct(Task $task, User $user, string $action, string $message = '')
    {
        $this->task = $task;
        $this->user = $user;
        $this->action = $action;
        $this->message = $message;
    }

    public function envelope(): Envelope
    {
        $verb = match ($this->action) {
            'created' => 'created',
            'updated' => 'updated',
            'commented' => 'commented on',
            default => $this->action,
        };

        return new Envelope(
            subject: "Task {$verb}: {$this->task->title}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.task-notification',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

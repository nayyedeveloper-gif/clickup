<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ ucfirst($action) }} Task</h1>
        </div>
        <div class="content">
            <p>Hello {{ $user->name }},</p>
            <p>A task has been {{ $action }}:</p>
            <h3>{{ $task->title }}</h3>
            @if($message)
                <p>{{ $message }}</p>
            @endif
            <p><strong>Priority:</strong> {{ ucfirst($task->priority) }}</p>
            @if($task->due_date)
                <p><strong>Due Date:</strong> {{ \Carbon\Carbon::parse($task->due_date)->format('F j, Y') }}</p>
            @endif
            @if($task->list)
                <p><strong>List:</strong> {{ $task->list->name }}</p>
            @endif
            <a href="{{ config('app.url') }}/tasks/{{ $task->id }}" class="button">View Task</a>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

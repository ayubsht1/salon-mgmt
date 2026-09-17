from django.db import migrations, models


def populate_usernames(apps, schema_editor):
    CustomUser = apps.get_model("main", "CustomUser")

    for user in CustomUser.objects.order_by("id"):
        base_username = user.email.split("@", 1)[0] or f"user{user.id}"
        username = base_username[:150]
        suffix = 1

        while CustomUser.objects.filter(username=username).exists():
            suffix_text = str(suffix)
            username = f"{base_username[:150 - len(suffix_text)]}{suffix_text}"
            suffix += 1

        user.username = username
        user.save(update_fields=["username"])


class Migration(migrations.Migration):
    dependencies = [
        ("main", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="customuser",
            name="username",
            field=models.CharField(max_length=150, null=True),
        ),
        migrations.RunPython(populate_usernames, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="customuser",
            name="username",
            field=models.CharField(max_length=150, unique=True),
        ),
    ]

# Generated by Django 3.1.7 on 2021-04-15 09:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('genie', '0005_auto_20210414_1316'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotebookTemplate',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('template', models.JSONField(default={})),
                ('formJson', models.JSONField(default={})),
                ('name', models.CharField(blank=True, max_length=200, null=True)),
            ],
        ),
    ]

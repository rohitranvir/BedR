def run():
    from api.models import Bed
    beds = Bed.objects.all()
    print("Total beds:", beds.count())
    for b in beds:
        print(f"Bed ID: {b.id}, Status: {b.status}, Room: {b.room_id}")

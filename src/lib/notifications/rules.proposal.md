// Proposta definitiva de regras para a coleção notifications no Firestore
match /notifications/{notificationId} {

  allow get, list: if isSignedIn() &&
    (
      resource.data.userId == request.auth.uid ||
      isAdmin()
    );

  allow update: if isSignedIn() &&
    resource.data.userId == request.auth.uid &&
    request.resource.data.diff(resource.data)
      .affectedKeys().hasOnly(['read']) &&
    request.resource.data.read is bool;

  allow create, delete: if false;
}
